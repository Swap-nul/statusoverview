import jenkins.model.*
import hudson.security.*
import hudson.security.csrf.DefaultCrumbIssuer
import jenkins.security.s2m.AdminWhitelistRule
import hudson.model.*

def instance = Jenkins.getInstance()

// Check if Jenkins is already configured
if (instance.getInstallState() == jenkins.install.InstallState.INITIAL_SETUP_COMPLETED) {
    println "Jenkins is already configured"
    return
}

// Disable setup wizard
try {
    instance.setInstallState(jenkins.install.InstallState.INITIAL_SETUP_COMPLETED)
    println "Setup wizard disabled"
} catch (Exception e) {
    println "Failed to disable setup wizard: ${e.message}"
}

// Configure security
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

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

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
    println "Jenkins configuration saved"
} catch (Exception e) {
    println "Error saving configuration: ${e.message}"
}

println "Basic Jenkins configuration completed"
