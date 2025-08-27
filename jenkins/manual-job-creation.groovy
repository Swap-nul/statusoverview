import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition

def instance = Jenkins.getInstance()

// Delete existing jobs
def bulkJob = instance.getItem("bulk-deployment-trigger")
if (bulkJob != null) {
    println "Deleting existing bulk-deployment-trigger job"
    bulkJob.delete()
}

def singleJob = instance.getItem("single-app-deployment")
if (singleJob != null) {
    println "Deleting existing single-app-deployment job"
    singleJob.delete()
}

// Create bulk deployment trigger job
println "Creating bulk deployment trigger job with parameters..."

def bulkJobDefinition = '''
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
        stage('Test') {
            steps {
                script {
                    echo "Bulk deployment parameters received:"
                    echo "Project: ${params.PROJECT_NAME}"
                    echo "From: ${params.FROM_ENVIRONMENT}"
                    echo "To: ${params.TO_ENVIRONMENT}"
                    echo "User: ${params.TRIGGER_USER}"
                    echo "Applications: ${params.APPLICATIONS_JSON}"
                }
            }
        }
    }
}
'''

def newBulkJob = instance.createProject(WorkflowJob, "bulk-deployment-trigger")
newBulkJob.definition = new CpsFlowDefinition(bulkJobDefinition, true)
newBulkJob.save()

println "Bulk deployment trigger job created successfully!"

// Create single app deployment job
println "Creating single app deployment job with parameters..."

def singleJobDefinition = '''
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
        stage('Test') {
            steps {
                script {
                    echo "Single app deployment parameters received:"
                    echo "Project: ${params.PROJECT_NAME}"
                    echo "App: ${params.APP_NAME}"
                    echo "From: ${params.FROM_ENVIRONMENT}"
                    echo "To: ${params.TO_ENVIRONMENT}"
                    echo "Version: ${params.VERSION}"
                    echo "Branch: ${params.BRANCH}"
                    echo "User: ${params.TRIGGER_USER}"
                    echo "Bulk Job ID: ${params.BULK_JOB_ID}"
                }
            }
        }
    }
}
'''

def newSingleJob = instance.createProject(WorkflowJob, "single-app-deployment")
newSingleJob.definition = new CpsFlowDefinition(singleJobDefinition, true)
newSingleJob.save()

println "Single app deployment job created successfully!"
println "Both jobs created with proper parameter definitions"
