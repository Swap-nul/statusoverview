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
        
        stage('Pre-deployment Checks') {
            steps {
                script {
                    echo "Performing pre-deployment checks for ${params.APP_NAME}..."
                    
                    // Add your pre-deployment checks here
                    // For example: check if the application exists, validate version, etc.
                    
                    // Simulate check
                    sleep(2)
                    echo "✓ ${params.APP_NAME} passed pre-deployment checks"
                    echo "✓ Version ${params.VERSION} is available"
                    echo "✓ Target environment ${params.TO_ENVIRONMENT} is accessible"
                }
            }
        }
        
        stage('Deploy Application') {
            steps {
                script {
                    echo "Deploying ${params.APP_NAME} version ${params.VERSION} to ${params.TO_ENVIRONMENT}..."
                    
                    try {
                        // Simulate deployment process
                        echo "1. Pulling image for ${params.APP_NAME}:${params.VERSION}"
                        sleep(3)
                        
                        echo "2. Updating deployment configuration for ${params.TO_ENVIRONMENT}"
                        sleep(2)
                        
                        echo "3. Rolling out ${params.APP_NAME} to ${params.TO_ENVIRONMENT}"
                        sleep(4)
                        
                        echo "4. Verifying deployment of ${params.APP_NAME}"
                        sleep(2)
                        
                        echo "✓ ${params.APP_NAME} deployed successfully to ${params.TO_ENVIRONMENT}"
                        
                        // Store deployment result
                        def deploymentResult = [
                            appName: params.APP_NAME,
                            version: params.VERSION,
                            branch: params.BRANCH,
                            fromEnvironment: params.FROM_ENVIRONMENT,
                            toEnvironment: params.TO_ENVIRONMENT,
                            status: 'SUCCESS',
                            deployedAt: new Date().toString(),
                            deployedBy: params.TRIGGER_USER,
                            buildNumber: env.BUILD_NUMBER,
                            bulkJobId: params.BULK_JOB_ID ?: null
                        ]
                        
                        writeJSON file: 'deployment-result.json', json: deploymentResult
                        archiveArtifacts artifacts: 'deployment-result.json', fingerprint: true
                        
                    } catch (Exception e) {
                        echo "✗ ${params.APP_NAME} deployment failed: ${e.message}"
                        
                        def deploymentResult = [
                            appName: params.APP_NAME,
                            version: params.VERSION,
                            branch: params.BRANCH,
                            fromEnvironment: params.FROM_ENVIRONMENT,
                            toEnvironment: params.TO_ENVIRONMENT,
                            status: 'FAILED',
                            error: e.message,
                            deployedAt: new Date().toString(),
                            deployedBy: params.TRIGGER_USER,
                            buildNumber: env.BUILD_NUMBER,
                            bulkJobId: params.BULK_JOB_ID ?: null
                        ]
                        
                        writeJSON file: 'deployment-result.json', json: deploymentResult
                        archiveArtifacts artifacts: 'deployment-result.json', fingerprint: true
                        
                        throw e
                    }
                }
            }
        }
        
        stage('Post-deployment Verification') {
            steps {
                script {
                    echo "Running post-deployment verification for ${params.APP_NAME}..."
                    
                    // Add your post-deployment verification here
                    // For example: health checks, smoke tests, etc.
                    
                    sleep(2)
                    echo "✓ ${params.APP_NAME} is healthy in ${params.TO_ENVIRONMENT}"
                    echo "✓ Post-deployment verification completed"
                }
            }
        }
    }
    
    post {
        always {
            script {
                def status = currentBuild.result ?: 'SUCCESS'
                def summary = "App Deployment Summary\\n"
                summary += "Application: ${params.APP_NAME}\\n"
                summary += "Version: ${params.VERSION}\\n"
                summary += "Environment: ${params.FROM_ENVIRONMENT} → ${params.TO_ENVIRONMENT}\\n"
                summary += "Status: ${status}\\n"
                summary += "Build: #${env.BUILD_NUMBER}"
                
                currentBuild.description = summary
                
                echo "=== Deployment Complete ==="
                echo "Application: ${params.APP_NAME}"
                echo "Status: ${status}"
                echo "Build Number: ${env.BUILD_NUMBER}"
                echo "=========================="
            }
        }
        
        success {
            echo "✅ ${params.APP_NAME} deployment completed successfully!"
        }
        
        failure {
            echo "❌ ${params.APP_NAME} deployment failed"
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
        
        stage('Trigger Individual Deployments') {
            steps {
                script {
                    def applications = readJSON text: params.APPLICATIONS_JSON
                    def bulkJobId = "bulk-${env.BUILD_NUMBER}-${System.currentTimeMillis()}"
                    def triggeredJobs = []
                    
                    echo "Starting bulk deployment with ID: ${bulkJobId}"
                    
                    applications.each { app ->
                        echo "Triggering deployment for ${app.appName}..."
                        
                        try {
                            def jobParameters = [
                                string(name: 'PROJECT_NAME', value: params.PROJECT_NAME),
                                string(name: 'APP_NAME', value: app.appName),
                                string(name: 'FROM_ENVIRONMENT', value: params.FROM_ENVIRONMENT),
                                string(name: 'TO_ENVIRONMENT', value: params.TO_ENVIRONMENT),
                                string(name: 'VERSION', value: app.version),
                                string(name: 'BRANCH', value: app.branch),
                                string(name: 'TRIGGER_USER', value: params.TRIGGER_USER),
                                string(name: 'BULK_JOB_ID', value: bulkJobId)
                            ]
                            
                            def triggeredJob = build job: 'single-app-deployment', 
                                                   parameters: jobParameters,
                                                   wait: false
                            
                            triggeredJobs.add([
                                appName: app.appName,
                                jobName: 'single-app-deployment',
                                buildNumber: triggeredJob.number,
                                buildUrl: triggeredJob.absoluteUrl
                            ])
                            
                            echo "✓ Triggered deployment job for ${app.appName} (Build #${triggeredJob.number})"
                            
                        } catch (Exception e) {
                            echo "✗ Failed to trigger deployment for ${app.appName}: ${e.message}"
                            triggeredJobs.add([
                                appName: app.appName,
                                error: e.message,
                                status: 'FAILED_TO_TRIGGER'
                            ])
                        }
                    }
                    
                    // Store the triggered jobs information
                    def bulkResult = [
                        bulkJobId: bulkJobId,
                        projectName: params.PROJECT_NAME,
                        fromEnvironment: params.FROM_ENVIRONMENT,
                        toEnvironment: params.TO_ENVIRONMENT,
                        triggeredBy: params.TRIGGER_USER,
                        triggeredAt: new Date().toString(),
                        totalApplications: applications.size(),
                        triggeredJobs: triggeredJobs,
                        bulkBuildNumber: env.BUILD_NUMBER
                    ]
                    
                    writeJSON file: 'bulk-deployment-result.json', json: bulkResult
                    archiveArtifacts artifacts: 'bulk-deployment-result.json', fingerprint: true
                    
                    echo "Bulk deployment trigger completed. ${triggeredJobs.size()} jobs triggered."
                    
                    // Set build description
                    def summary = "Bulk Deployment Summary\\n"
                    summary += "Project: ${params.PROJECT_NAME}\\n"
                    summary += "Environment: ${params.FROM_ENVIRONMENT} → ${params.TO_ENVIRONMENT}\\n"
                    summary += "Applications: ${applications.size()}\\n"
                    summary += "Jobs Triggered: ${triggeredJobs.findAll { !it.error }.size()}\\n"
                    summary += "Bulk ID: ${bulkJobId}"
                    
                    currentBuild.description = summary
                }
            }
        }
    }
    
    post {
        always {
            echo "Bulk deployment trigger job completed"
        }
        
        success {
            echo "✅ All deployment jobs triggered successfully!"
        }
        
        failure {
            echo "❌ Bulk deployment trigger failed"
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
