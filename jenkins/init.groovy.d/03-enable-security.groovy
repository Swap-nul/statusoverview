import jenkins.model.*
import hudson.security.*
import hudson.security.csrf.*

// Wait for job creation to complete before enabling security
Thread.start {
    sleep(90000) // Wait 90 seconds for job creation to complete
    
    try {
        def instance = Jenkins.getInstance()
        
        println "Enabling Jenkins security..."
        
        // Set authorization strategy - no need to create admin user as it's already done
        def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
        strategy.setAllowAnonymousRead(false)
        instance.setAuthorizationStrategy(strategy)
        
        println "Authorization strategy enabled"
        
        // Save configuration
        instance.save()
        println "Security configuration saved"
        
        println "Jenkins security enabled successfully"
        
    } catch (Exception e) {
        println "Error enabling security: ${e.message}"
        e.printStackTrace()
    }
}

println "Security enablement script scheduled"
