FROM jenkins/jenkins:lts

# Switch to root to install plugins
USER root

# Copy plugins list
COPY jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt

# Install plugins
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Copy initialization scripts
COPY jenkins/init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

# Set proper permissions
RUN chown -R jenkins:jenkins /usr/share/jenkins/ref/

# Switch back to jenkins user
USER jenkins

# Expose ports
EXPOSE 8080 50000
