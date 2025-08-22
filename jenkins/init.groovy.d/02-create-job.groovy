import jenkins.model.*
import hudson.model.*

// Wait for Jenkins to be fully loaded and plugins to be available
Thread.start {
    sleep(30000) // Wait 30 seconds for plugins to load
    
    try {
        // Import workflow classes after plugins are loaded
        def WorkflowJob = Class.forName('org.jenkinsci.plugins.workflow.job.WorkflowJob')
        def CpsFlowDefinition = Class.forName('org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition')
        
        def instance = Jenkins.getInstance()
        def jobName = "bulk-deployment-job"
        def job = instance.getItem(jobName)

        if (job == null) {
            println "Creating bulk deployment job..."
            
            def jobDefinition = '''
pipeline {
    agent any
    
    parameters {
        string(name: 'PROJECT_NAME', defaultValue: '', description: 'Name of the project')
        string(name: 'FROM_ENVIRONMENT', defaultValue: '', description: 'Source environment')
        string(name: 'TO_ENVIRONMENT', defaultValue: '', description: 'Target environment')
        text(name: 'APPLICATIONS_JSON', defaultValue: '[]', description: 'JSON array of applications to deploy')
        string(name: 'TRIGGER_USER', defaultValue: 'system', description: 'User who triggered the deployment')
    }
    
    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    if (!params.PROJECT_NAME) {
                        error("PROJECT_NAME parameter is required")
                    }
                    if (!params.FROM_ENVIRONMENT) {
                        error("FROM_ENVIRONMENT parameter is required")
                    }
                    if (!params.TO_ENVIRONMENT) {
                        error("TO_ENVIRONMENT parameter is required")
                    }
                    
                    echo "Project: ${params.PROJECT_NAME}"
                    echo "From Environment: ${params.FROM_ENVIRONMENT}"
                    echo "To Environment: ${params.TO_ENVIRONMENT}"
                    echo "Triggered by: ${params.TRIGGER_USER}"
                    
                    def applications = readJSON text: params.APPLICATIONS_JSON
                    echo "Applications to deploy: ${applications.size()}"
                    
                    applications.each { app ->
                        echo "- ${app.appName} (${app.version})"
                    }
                }
            }
        }
        
        stage('Pre-deployment Checks') {
            steps {
                script {
                    echo "Performing pre-deployment checks..."
                    
                    def applications = readJSON text: params.APPLICATIONS_JSON
                    
                    applications.each { app ->
                        echo "Checking ${app.appName}..."
                        // Add your pre-deployment checks here
                        // For example: check if the application exists, validate version, etc.
                        
                        // Simulate check
                        sleep(1)
                        echo "✓ ${app.appName} passed pre-deployment checks"
                    }
                }
            }
        }
        
        stage('Deploy Applications') {
            steps {
                script {
                    def applications = readJSON text: params.APPLICATIONS_JSON
                    def deploymentResults = []
                    
                    applications.each { app ->
                        echo "Deploying ${app.appName} version ${app.version} to ${params.TO_ENVIRONMENT}..."
                        
                        try {
                            // Simulate deployment process
                            echo "1. Pulling image for ${app.appName}:${app.version}"
                            sleep(2)
                            
                            echo "2. Updating deployment configuration"
                            sleep(1)
                            
                            echo "3. Rolling out to ${params.TO_ENVIRONMENT}"
                            sleep(3)
                            
                            echo "4. Verifying deployment"
                            sleep(2)
                            
                            deploymentResults.add([
                                appName: app.appName,
                                status: 'SUCCESS',
                                version: app.version,
                                message: "Successfully deployed to ${params.TO_ENVIRONMENT}"
                            ])
                            
                            echo "✓ ${app.appName} deployed successfully"
                            
                        } catch (Exception e) {
                            deploymentResults.add([
                                appName: app.appName,
                                status: 'FAILED',
                                version: app.version,
                                message: "Deployment failed: ${e.message}"
                            ])
                            
                            echo "✗ ${app.appName} deployment failed: ${e.message}"
                        }
                    }
                    
                    // Store results for post-processing
                    writeJSON file: 'deployment-results.json', json: deploymentResults
                    archiveArtifacts artifacts: 'deployment-results.json', fingerprint: true
                }
            }
        }
        
        stage('Post-deployment Verification') {
            steps {
                script {
                    echo "Running post-deployment verification..."
                    
                    def results = readJSON file: 'deployment-results.json'
                    def successCount = results.count { it.status == 'SUCCESS' }
                    def failCount = results.count { it.status == 'FAILED' }
                    
                    echo "Deployment Summary:"
                    echo "- Successful: ${successCount}"
                    echo "- Failed: ${failCount}"
                    echo "- Total: ${results.size()}"
                    
                    if (failCount > 0) {
                        echo "Some deployments failed:"
                        results.findAll { it.status == 'FAILED' }.each { app ->
                            echo "  ✗ ${app.appName}: ${app.message}"
                        }
                        
                        // Mark build as unstable if some deployments failed
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Bulk deployment job completed"
            
            script {
                def results = readJSON file: 'deployment-results.json'
                def summary = "Bulk Deployment Summary\\n"
                summary += "Project: ${params.PROJECT_NAME}\\n"
                summary += "From: ${params.FROM_ENVIRONMENT} → To: ${params.TO_ENVIRONMENT}\\n"
                summary += "Applications: ${results.size()}\\n"
                summary += "Success: ${results.count { it.status == 'SUCCESS' }}\\n"
                summary += "Failed: ${results.count { it.status == 'FAILED' }}\\n"
                
                currentBuild.description = summary
            }
        }
        
        success {
            echo "All deployments completed successfully!"
        }
        
        unstable {
            echo "Deployment completed with some failures"
        }
        
        failure {
            echo "Deployment job failed"
        }
    }
}
'''

            job = instance.createProject(WorkflowJob, jobName)
            job.definition = CpsFlowDefinition.newInstance(jobDefinition, true)
            job.save()
            
            println "Bulk deployment job created successfully"
        } else {
            println "Bulk deployment job already exists"
        }
        
    } catch (Exception e) {
        println "Error creating job: ${e.message}"
        e.printStackTrace()
    }
}

println "Job creation script scheduled"
