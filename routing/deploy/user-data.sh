#!/bin/bash
set -euxo pipefail
exec > >(tee /var/log/transitreach-setup.log) 2>&1

# OTP 2.5.0 requires Java 17+. Corretto is AWS's OpenJDK build, native on Graviton.
dnf install -y java-21-amazon-corretto-headless

install -d -o ec2-user -g ec2-user /opt/otp
cd /opt/otp

# Pulled at AWS network speed rather than uploaded from a home connection.
curl -fsSL -o otp-2.5.0-shaded.jar \
  https://repo1.maven.org/maven2/org/opentripplanner/otp/2.5.0/otp-2.5.0-shaded.jar
curl -fsSL -o malaysia-singapore-brunei-latest.osm.pbf \
  https://download.geofabrik.de/asia/malaysia-singapore-brunei-latest.osm.pbf

chown -R ec2-user:ec2-user /opt/otp
touch /opt/otp/DOWNLOADS_COMPLETE
