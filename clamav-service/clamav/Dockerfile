FROM registry.access.redhat.com/ubi9/ubi:9.5-1742918310
ARG VERSION=1.0.5

LABEL name="ubi8-clamav" \
      vendor="Red Hat" \
      version="${VERSION}" \
      release="1" \
      summary="UBI 9 ClamAV" \
      description="ClamAV for UBI 9"

RUN yum -y update && \
    yum -y install https://www.clamav.net/downloads/production/clamav-${VERSION}.linux.x86_64.rpm && \
    yum -y install nc wget && \
    yum clean all

# copy our configs to where clamav expects
COPY config/clamd.conf /usr/local/etc/clamd.conf
COPY config/freshclam.conf /usr/local/etc/freshclam.conf


RUN mkdir -p /opt/app-root/src
# copy health check script to app-root
COPY clamdcheck.sh /opt/app-root
RUN chown -R 1001:0 /opt/app-root/src && \
    chmod -R ug+rwx /opt/app-root/src && \
    chmod ug+rwx /opt/app-root/clamdcheck.sh

RUN mkdir /var/log/clamav && \
    touch /var/log/clamav/clamav.log && \
    touch /var/log/clamav/freshclam.log && \
    chown -R 1001:0 /var/log/clamav && \
    chmod -R ug+rwx /var/log/clamav && \
    chown -R 1001:0 /opt/app-root/src

USER 1001

EXPOSE 3310
# there is healthcheck in openshift deployment, this is just for removing security alerts
HEALTHCHECK --interval=180000s CMD /opt/app-root/clamdcheck.sh
CMD freshclam && clamd
