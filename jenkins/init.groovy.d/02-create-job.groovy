import jenkins.model.*
import hudson.model.*
import hudson.security.*
import hudson.security.ACL

def createSingleAppDeploymentJob(instance, WorkflowJob, CpsFlowDefinition) {
    def jobName = "single-app-deployment"
    def job = instance.getItem(jobName)

    // Always recreate the job to ensure parameters are properly configured
    if (job != null) {
        println "Deleting existing single app deployment job to recreate with proper parameters..."
        job.delete()
    }
    
    println "Creating single app deployment job..."
        
        def jobDefinition = '''
pipeline {
    agent any
    
    parameters {
        string(name: 'PROJECT_NAME', defaultValue: '', description: 'Name of the project')
        string(name: 'APP_NAME', defaultValue: '', description: 'Name of the application to deploy')
        string(name: 'FROM_ENVIRONMENT', defaultValue: '', description: 'Source environment')
        string(name: 'TO_ENVIRONMENT', defaultValue: '', description: 'Target environment')
        string(name: 'VERSION', defaultValue: '', description: 'Application version to deploy')
        string(name: 'BRANCH', defaultValue: '', description: 'Application branch')
        string(name: 'TRIGGER_USER', defaultValue: 'system', description: 'User who triggered the deployment')
        string(name: 'BULK_JOB_ID', defaultValue: '', description: 'ID of the bulk deployment job (if part of bulk)')
    }
    
    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    if (!params.PROJECT_NAME) {
                        error("PROJECT_NAME parameter is required")
                    }
                    if (!params.APP_NAME) {
                        error("APP_NAME parameter is required")
                    }
                    if (!params.FROM_ENVIRONMENT) {
                        error("FROM_ENVIRONMENT parameter is required")
                    }
                    if (!params.TO_ENVIRONMENT) {
                        error("TO_ENVIRONMENT parameter is required")
                    }
                    if (!params.VERSION) {
                        error("VERSION parameter is required")
                    }
                    
                    echo "=== Deployment Parameters ==="
                    echo "Project: ${params.PROJECT_NAME}"
                    echo "Application: ${params.APP_NAME}"
                    echo "Version: ${params.VERSION}"
                    echo "Branch: ${params.BRANCH}"
                    echo "From Environment: ${params.FROM_ENVIRONMENT}"
                    echo "To Environment: ${params.TO_ENVIRONMENT}"
                    echo "Triggered by: ${params.TRIGGER_USER}"
                    if (params.BULK_JOB_ID) {
                        echo "Part of bulk deployment: ${params.BULK_JOB_ID}"
                    }
                    echo "=========================="
                }
            }
        }
        
        stage('Print Deployment Request') {
            steps {
                script {
                    echo "============================================"
                    echo "         DEPLOYMENT REQUEST RECEIVED       "
                    echo "============================================"
                    echo ""
                    echo "📋 REQUEST DETAILS:"
                    echo "  Project Name: ${params.PROJECT_NAME}"
                    echo "  Application: ${params.APP_NAME}"
                    echo "  Version: ${params.VERSION}"
                    echo "  Branch: ${params.BRANCH}"
                    echo "  From Environment: ${params.FROM_ENVIRONMENT}"
                    echo "  To Environment: ${params.TO_ENVIRONMENT}"
                    echo "  Triggered By: ${params.TRIGGER_USER}"
                    echo "  Build Number: ${env.BUILD_NUMBER}"
                    echo "  Timestamp: ${new Date().toString()}"
                    if (params.BULK_JOB_ID) {
                        echo "  Bulk Job ID: ${params.BULK_JOB_ID}"
                    }
                    echo ""
                    echo "📝 ACTION: Print deployment request only (no actual deployment)"
                    echo ""
                    echo "✅ Request successfully logged and displayed"
                    echo "============================================"
                    
                    // Store the request details for archival
                    def deploymentRequest = [
                        appName: params.APP_NAME,
                        version: params.VERSION,
                        branch: params.BRANCH,
                        fromEnvironment: params.FROM_ENVIRONMENT,
                        toEnvironment: params.TO_ENVIRONMENT,
                        status: 'REQUEST_LOGGED',
                        requestedAt: new Date().toString(),
                        requestedBy: params.TRIGGER_USER,
                        buildNumber: env.BUILD_NUMBER,
                        bulkJobId: params.BULK_JOB_ID ?: null,
                        action: 'Print request only - no deployment performed'
                    ]
                    
                    def jsonBuilder = new groovy.json.JsonBuilder(deploymentRequest)
                    writeFile file: 'deployment-request.json', text: jsonBuilder.toPrettyString()
                    archiveArtifacts artifacts: 'deployment-request.json', fingerprint: true
                }
            }
        }
    }
    
    post {
        always {
            script {
                def status = currentBuild.result ?: 'SUCCESS'
                def summary = "App Deployment Request Logged\\n"
                summary += "Application: ${params.APP_NAME}\\n"
                summary += "Version: ${params.VERSION}\\n"
                summary += "Environment: ${params.FROM_ENVIRONMENT} → ${params.TO_ENVIRONMENT}\\n"
                summary += "Status: ${status}\\n"
                summary += "Build: #${env.BUILD_NUMBER}\\n"
                summary += "Action: Print request only"
                
                currentBuild.description = summary
                
                echo "=== Request Logging Complete ==="
                echo "Application: ${params.APP_NAME}"
                echo "Status: ${status}"
                echo "Build Number: ${env.BUILD_NUMBER}"
                echo "Action: Request printed only"
                echo "=========================="
            }
        }
        
        success {
            echo "✅ ${params.APP_NAME} deployment request logged successfully!"
        }
        
        failure {
            echo "❌ ${params.APP_NAME} deployment request logging failed"
        }
    }
}
'''

        job = instance.createProject(WorkflowJob, jobName)
        job.definition = CpsFlowDefinition.newInstance(jobDefinition, true)
        job.save()
        
        println "Single app deployment job created successfully"
}

def createBulkDeploymentTriggerJob(instance, WorkflowJob, CpsFlowDefinition) {
    def jobName = "bulk-deployment-trigger"
    def job = instance.getItem(jobName)

    // Always recreate the job to ensure parameters are properly configured
    if (job != null) {
        println "Deleting existing bulk deployment trigger job to recreate with proper parameters..."
        job.delete()
    }
    
    println "Creating bulk deployment trigger job..."
        
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
                    
                    def applications = readJSON text: params.APPLICATIONS_JSON
                    if (applications.size() == 0) {
                        error("No applications specified for deployment")
                    }
                    
                    echo "=== Bulk Deployment Parameters ==="
                    echo "Project: ${params.PROJECT_NAME}"
                    echo "From Environment: ${params.FROM_ENVIRONMENT}"
                    echo "To Environment: ${params.TO_ENVIRONMENT}"
                    echo "Triggered by: ${params.TRIGGER_USER}"
                    echo "Applications to deploy: ${applications.size()}"
                    
                    applications.each { app ->
                        echo "- ${app.appName} (${app.version}) [${app.branch}]"
                    }
                    echo "================================"
                }
            }
        }
        
        stage('Print Bulk Deployment Request') {
            steps {
                script {
                    def jsonSlurper = new groovy.json.JsonSlurper()
                    def applications = jsonSlurper.parseText(params.APPLICATIONS_JSON)
                    def bulkJobId = "bulk-${env.BUILD_NUMBER}-${System.currentTimeMillis()}"
                    
                    echo "============================================"
                    echo "      BULK DEPLOYMENT REQUEST RECEIVED     "
                    echo "============================================"
                    echo ""
                    echo "📋 BULK REQUEST DETAILS:"
                    echo "  Bulk Job ID: ${bulkJobId}"
                    echo "  Project Name: ${params.PROJECT_NAME}"
                    echo "  From Environment: ${params.FROM_ENVIRONMENT}"
                    echo "  To Environment: ${params.TO_ENVIRONMENT}"
                    echo "  Triggered By: ${params.TRIGGER_USER}"
                    echo "  Total Applications: ${applications.size()}"
                    echo "  Build Number: ${env.BUILD_NUMBER}"
                    echo "  Timestamp: ${new Date().toString()}"
                    echo ""
                    echo "📝 APPLICATIONS TO DEPLOY:"
                    
                    def loggedApps = []
                    applications.eachWithIndex { app, index ->
                        echo "  ${index + 1}. Application: ${app.appName}"
                        echo "     Version: ${app.version}"
                        echo "     Branch: ${app.branch}"
                        echo "     From: ${params.FROM_ENVIRONMENT} → To: ${params.TO_ENVIRONMENT}"
                        echo ""
                        
                        loggedApps.add([
                            appName: app.appName,
                            version: app.version,
                            branch: app.branch,
                            status: 'REQUEST_LOGGED'
                        ])
                    }
                    
                    echo "📝 ACTION: Print bulk deployment request only (no actual deployments triggered)"
                    echo ""
                    echo "✅ Bulk request successfully logged and displayed"
                    echo "============================================"
                    
                    // Store the bulk request information
                    def bulkResult = [
                        bulkJobId: bulkJobId,
                        projectName: params.PROJECT_NAME,
                        fromEnvironment: params.FROM_ENVIRONMENT,
                        toEnvironment: params.TO_ENVIRONMENT,
                        triggeredBy: params.TRIGGER_USER,
                        requestedAt: new Date().toString(),
                        totalApplications: applications.size(),
                        applications: loggedApps,
                        bulkBuildNumber: env.BUILD_NUMBER,
                        action: 'Print request only - no deployments triggered',
                        status: 'REQUEST_LOGGED'
                    ]
                    
                    def bulkJsonBuilder = new groovy.json.JsonBuilder(bulkResult)
                    writeFile file: 'bulk-deployment-request.json', text: bulkJsonBuilder.toPrettyString()
                    archiveArtifacts artifacts: 'bulk-deployment-request.json', fingerprint: true
                    
                    echo "Bulk deployment request logged. ${applications.size()} applications listed."
                    
                    // Set build description
                    def summary = "Bulk Deployment Request Logged\\n"
                    summary += "Project: ${params.PROJECT_NAME}\\n"
                    summary += "Environment: ${params.FROM_ENVIRONMENT} → ${params.TO_ENVIRONMENT}\\n"
                    summary += "Applications: ${applications.size()}\\n"
                    summary += "Action: Print request only\\n"
                    summary += "Bulk ID: ${bulkJobId}"
                    
                    currentBuild.description = summary
                }
            }
        }
    }
    
    post {
        always {
            echo "Bulk deployment request logging completed"
        }
        
        success {
            echo "✅ All deployment requests logged successfully!"
        }
        
        failure {
            echo "❌ Bulk deployment request logging failed"
        }
    }
}
'''

        job = instance.createProject(WorkflowJob, jobName)
        job.definition = CpsFlowDefinition.newInstance(jobDefinition, true)
        job.save()
        
        println "Bulk deployment trigger job created successfully"
}

// Wait for Jenkins to be fully loaded and plugins to be available
Thread.start {
    sleep(30000) // Wait 30 seconds for plugins to load
    
    try {
        // Import workflow classes after plugins are loaded
        def WorkflowJob = Class.forName('org.jenkinsci.plugins.workflow.job.WorkflowJob')
        def CpsFlowDefinition = Class.forName('org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition')
        
        def instance = Jenkins.getInstance()
        
        // Use system ACL to create jobs
        ACL.impersonate(ACL.SYSTEM, {
            // Create single app deployment job
            createSingleAppDeploymentJob(instance, WorkflowJob, CpsFlowDefinition)
            
            // Create bulk deployment trigger job
            createBulkDeploymentTriggerJob(instance, WorkflowJob, CpsFlowDefinition)
        } as Runnable)
        
    } catch (Exception e) {
        println "Error creating jobs: ${e.message}"
        e.printStackTrace()
    }
}

println "Job creation script scheduled"
