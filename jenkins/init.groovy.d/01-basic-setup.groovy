import jenkins.model.*
import hudson.security.*
import hudson.security.csrf.DefaultCrumbIssuer
import jenkins.security.s2m.AdminWhitelistRule
import hudson.model.*

def instance = Jenkins.getInstance()

println "Starting Jenkins basic configuration..."

// Disable setup wizard by setting system property
System.setProperty("jenkins.install.runSetupWizard", "false")
println "Setup wizard disabled"

// Configure security realm but set unsecured authorization initially
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
try {
    if (!hudsonRealm.getAllUsers().find { it.getId() == "admin" }) {
        hudsonRealm.createAccount("admin", "admin123")
        println "Admin user created"
    } else {
        println "Admin user already exists"
    }
} catch (Exception e) {
    println "Error creating admin user: ${e.message}"
}

instance.setSecurityRealm(hudsonRealm)

// Set unsecured authorization strategy for job creation
def unsecuredStrategy = new AuthorizationStrategy.Unsecured()
instance.setAuthorizationStrategy(unsecuredStrategy)
println "Unsecured authorization strategy set for job creation"

// Disable CSRF protection for API endpoints to allow cross-origin requests
try {
    instance.setCrumbIssuer(null)
    println "CSRF protection disabled"
} catch (Exception e) {
    println "Error disabling CSRF: ${e.message}"
}

// Configure agent protocols
try {
    instance.getDescriptor("jenkins.CLI").get().setEnabled(false)
    instance.agentProtocols = ["JNLP4-connect", "Ping"] as Set
    println "Agent protocols configured"
} catch (Exception e) {
    println "Error configuring agent protocols: ${e.message}"
}

// Configure system properties for CORS
try {
    System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
    System.setProperty("jenkins.model.Jenkins.crumbIssuerProxyCompatibility", "true")
    println "System properties configured"
} catch (Exception e) {
    println "Error setting system properties: ${e.message}"
}

// Save configuration
try {
    instance.save()
    println "Jenkins configuration saved with unsecured authorization"
} catch (Exception e) {
    println "Error saving configuration: ${e.message}"
}

println "Basic Jenkins configuration completed (using unsecured authorization for job creation)"
