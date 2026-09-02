# Deploying the routing engine to AWS

The web app is a static build on Netlify. OpenTripPlanner is a long-lived JVM holding a
~517 MB graph in memory, which no static host or serverless function can run. So the
deployment is two pieces:

```
Netlify (static, free)  ──/otp/* proxy──▶  EC2 instance running OTP
```

**Nothing here is created automatically. Every resource below is listed with the exact
command that destroys it.** Read "Teardown" before you start.

## Sizing, and what it costs

Measured on the development machine: OTP holds **1.8–2.2 GB resident** and takes
**25 seconds** from launch to serving. The AWS free-tier `t3.micro` has 1 GB, so it is too
small — this runs on credits, not free-tier hours.

| Resource | Spec | ~Monthly |
|---|---|---|
| EC2 `t4g.medium` | ARM64, 2 vCPU, 4 GB | ~$24.50 |
| EBS gp3 root volume | 30 GB | ~$2.40 |
| Public IPv4 address | 1 Elastic IP | ~$3.60 |
| **Total** | | **~$30.50** |

$120 of credits is therefore roughly **four months**. Set a billing alarm.

**The single biggest saving available** is clipping the OSM extract. The graph is large
because it covers all of Malaysia, Singapore and Brunei; a Klang Valley bbox
(lat 2.79–3.37, lon 101.31–101.93) from <https://extract.bbbike.org/> should bring RSS to
roughly 1–1.2 GB, allowing `t4g.small` at about half the cost. Deferred for now — see the
main `routing/README.md`.

## Why ARM (`t4g`)

Graviton instances are roughly 20% cheaper than the x86 equivalent, and Temurin publishes
ARM64 builds, so Java runs natively. Nothing in this stack is architecture-specific.

## Why the graph is built on the instance, not uploaded

The build needs ~12 GB of heap; the serving instance has 4 GB. Two options exist:

1. Build locally and upload `graph.obj` — but that is a ~700 MB upload from a home
   connection, and it ships an x86-built Kryo artifact to an ARM host.
2. **Build on a temporarily larger instance, then downsize.** The instance pulls the
   238 MB OSM extract and the 175 MB jar at AWS network speed, builds in about five
   minutes, then is stopped and resized to `t4g.medium` for serving.

Option 2 is used. The oversized build window costs a few cents, and the Elastic IP means
the address survives the stop/start that resizing requires.

## Resources this creates

| Resource | Name / tag | Purpose |
|---|---|---|
| Key pair | `transitreach-otp` | SSH access; private key saved locally, never committed |
| Security group | `transitreach-otp-sg` | Inbound 8080 from anywhere, 22 from your IP only |
| EC2 instance | `transitreach-otp` | Runs OTP under systemd |
| Elastic IP | tagged `transitreach-otp` | Stable address so resizing does not break Netlify |

All are tagged `Project=transitreach` so nothing is ambiguous at teardown.

## Security — read this

**OTP has no authentication.** Port 8080 must be open to the internet because Netlify's
proxy egress addresses are not stable, so anyone who finds the address can issue routing
queries against it. For a student project on capped credits this is a considered
trade-off, not an oversight, but be aware of it:

- The instance holds no personal data and no credentials. The worst case is credit burn
  through compute, not a data breach.
- **Set a billing alarm** so runaway usage surfaces immediately.
- If it becomes a problem, put nginx in front with `limit_req`, or move to CloudFront with
  a custom header the origin requires.

SSH (22) is restricted to your own IP at creation time. If your address changes, update the
security group rather than opening 22 to the world.

## Prerequisites you must do yourself

1. In the AWS console, create an IAM user with programmatic access and the
   `AmazonEC2FullAccess` policy. A dedicated user is better than root credentials.
2. Run `aws configure` locally and paste the key and secret **into that prompt**, not into
   any chat or file. They are stored in `~/.aws/credentials` and read by the CLI.
3. Pick a region close to Kuala Lumpur — `ap-southeast-1` (Singapore) is the obvious one,
   and keeps latency to the isochrone endpoint low.

Confirm it works before going further:

```bash
aws sts get-caller-identity
```

## Teardown — deletes everything and stops all charges

Run in this order. The Elastic IP is billed even when unattached, so release it.

```bash
# 1. Terminate the instance
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
aws ec2 wait instance-terminated --instance-ids <INSTANCE_ID>

# 2. Release the Elastic IP  (billed while allocated — do not skip)
aws ec2 release-address --allocation-id <ALLOCATION_ID>

# 3. Delete the security group and key pair
aws ec2 delete-security-group --group-name transitreach-otp-sg
aws ec2 delete-key-pair --key-name transitreach-otp
```

The concrete ids are written to `routing/deploy/created-resources.txt` as they are
created. That file is gitignored — it identifies your infrastructure, not the project's.

Verify nothing is left running:

```bash
aws ec2 describe-instances --filters "Name=tag:Project,Values=transitreach" \
  --query "Reservations[].Instances[].[InstanceId,State.Name]" --output table
aws ec2 describe-addresses --query "Addresses[].[PublicIp,AllocationId]" --output table
```

## After the instance is up

1. Note the Elastic IP.
2. In `public/_redirects`, **above** the SPA catch-all:

   ```
   /otp/*   http://<ELASTIC_IP>:8080/otp/:splat   200
   /*       /index.html                           200
   ```

   Order matters: if `/*` comes first it swallows `/otp/*` and every routing call returns
   `index.html`.
3. Set `VITE_OTP_BASE_URL=/` in Netlify's environment variables. The trailing-slash strip
   in `routingAdapter.ts` turns that into an empty base, so the app calls `/otp/...` on its
   own origin and Netlify forwards it. The browser only ever speaks HTTPS to Netlify, so
   the instance needs no certificate and no domain.
4. Redeploy. `VITE_*` variables are inlined at build time, so a redeploy is required for
   the change to take effect.
