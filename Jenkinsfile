pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:21-alpine
    command:
    - cat
    tty: true
    resources:
      requests:
        memory: "2Gi"
        cpu: "1"
      limits:
        memory: "4Gi"
        cpu: "2"
  - name: docker
    image: docker:24-dind
    securityContext:
      privileged: true
    resources:
      requests:
        memory: "1Gi"
        cpu: "0.5"
      limits:
        memory: "2Gi"
        cpu: "1"
"""
        }
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Target environment for deployment')
        booleanParam(name: 'PERFORM_DEPLOYMENT', defaultValue: false, description: 'Check to perform deployment')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip lint and format checks')
    }

    environment {
        VERSION = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        DOCKER_HUB_IMAGE = "webdev0594/moco-frontend"
        PORT = "80"
        NODE_OPTIONS = "--max-old-space-size=4096"
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    echo "=== Pipeline Configuration ==="
                    echo "Environment: ${params.ENVIRONMENT}"
                    echo "Deployment will be performed: ${params.PERFORM_DEPLOYMENT}"
                    echo "Skip tests: ${params.SKIP_TESTS}"
                    echo "Current branch: ${env.BRANCH_NAME}"
                    echo "Version: ${VERSION}"
                    echo "Docker image: ${DOCKER_HUB_IMAGE}:${VERSION}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: scm.branches,
                    extensions: [
                        [$class: 'SubmoduleOption',
                         disableSubmodules: false,
                         parentCredentials: true,
                         recursiveSubmodules: true,
                         reference: '',
                         trackingSubmodules: false
                        ]
                    ],
                    submoduleCfg: [],
                    userRemoteConfigs: scm.userRemoteConfigs
                ])
            }
        }

        stage('Build & Push Docker Image') {
            options {
                timeout(time: 20, unit: 'MINUTES')
            }
            steps {
                container('docker') {
                    script {
                        withCredentials([usernamePassword(
                            credentialsId: 'registry-credential',
                            usernameVariable: 'DOCKER_HUB_USERNAME',
                            passwordVariable: 'DOCKER_HUB_PASSWORD'
                        )]) {
                            sh """
                                echo "Building Docker image..."
                                docker build -t ${DOCKER_HUB_IMAGE}:${VERSION} .
                                docker tag ${DOCKER_HUB_IMAGE}:${VERSION} ${DOCKER_HUB_IMAGE}:latest
                                
                                echo "Logging into Docker Hub..."
                                echo "${DOCKER_HUB_PASSWORD}" | docker login -u "${DOCKER_HUB_USERNAME}" --password-stdin
                                
                                echo "Pushing Docker images..."
                                docker push ${DOCKER_HUB_IMAGE}:${VERSION}
                                docker push ${DOCKER_HUB_IMAGE}:latest
                                
                                echo "Cleaning up local images..."
                                docker rmi ${DOCKER_HUB_IMAGE}:${VERSION} ${DOCKER_HUB_IMAGE}:latest || true
                            """
                        }
                    }
                }
            }
        }

        stage('Check Deploy Conditions') {
            steps {
                script {
                    echo "=== Deploy Condition Check ==="
                    echo "PERFORM_DEPLOYMENT: ${params.PERFORM_DEPLOYMENT}"
                    echo "Current Branch: ${env.BRANCH_NAME}"
                    echo "Environment: ${params.ENVIRONMENT}"
                    
                    def shouldDeploy = params.PERFORM_DEPLOYMENT == true
                    echo "Should deploy: ${shouldDeploy}"
                    env.SHOULD_DEPLOY = shouldDeploy ? 'true' : 'false'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { 
                    params.PERFORM_DEPLOYMENT == true
                }
            }
            stages {
                stage('Approve Production Deploy') {
                    when {
                        expression { params.ENVIRONMENT == 'prod' }
                    }
                    steps {
                        input message: "Deploy to Production environment?", ok: "Deploy",
                              submitterParameter: 'APPROVER'
                        script {
                            echo "Production deployment approved by: ${env.APPROVER}"
                        }
                    }
                }
                
                stage('Update Helm Values') {
                    steps {
                        container('node') {
                            withCredentials([usernamePassword(
                                credentialsId: 'git-credential', 
                                usernameVariable: 'GIT_USERNAME', 
                                passwordVariable: 'GIT_PASSWORD'
                            )]) {
                                script {
                                    def valuesFile = params.ENVIRONMENT == 'prod' ? 'values-prod.yaml' : "values-${params.ENVIRONMENT}.yaml"
                                    
                                    sh """
                                        echo "Cloning deployment repository..."
                                        git clone https://\${GIT_USERNAME}:\${GIT_PASSWORD}@github.com/moco-labs/moco-chart.git deploy-repo
                                        cd deploy-repo
                                        
                                        echo "Updating image tag in ${valuesFile}..."
                                        sed -i 's/tag: ".*"/tag: "${VERSION}"/g' infrastructure/helm-charts/applications/frontend/${valuesFile}
                                        
                                        echo "Configuring git..."
                                        git config --global user.email "me@mooowu.xyz" 
                                        git config --global user.name "moco-ci"
                                        
                                        echo "Committing changes..."
                                        git add infrastructure/helm-charts/applications/frontend/${valuesFile}
                                        git commit -m "update moco-fe version to ${VERSION} for ${params.ENVIRONMENT}"
                                        
                                        echo "Pushing changes..."
                                        git push origin main
                                        
                                        echo "Deployment configuration updated successfully!"
                                    """
                                }
                            }
                        }
                    }
                }
                
                stage('Verify Deployment') {
                    steps {
                        script {
                            echo "Deployment verification for ${params.ENVIRONMENT} environment"
                            echo "Image: ${DOCKER_HUB_IMAGE}:${VERSION}"
                            echo "Next steps: Monitor the deployment in Kubernetes cluster"
                            
                            // Here you could add actual deployment verification steps
                            // such as health checks, smoke tests, etc.
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo '=== Pipeline Summary ==='
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Version: ${VERSION}"
                echo "Environment: ${params.ENVIRONMENT}"
                echo "Deployment performed: ${env.SHOULD_DEPLOY ?: 'false'}"
            }
        }
        success {
            script {
                def message = "✅ Pipeline succeeded!"
                if (env.SHOULD_DEPLOY == 'true') {
                    message += " Deployed to ${params.ENVIRONMENT} environment."
                }
                echo message
                // TODO: Add Slack/Email notification
                // slackSend(message: message, channel: '#deployments')
            }
        }
        failure {
            script {
                def message = "❌ Pipeline failed for branch ${env.BRANCH_NAME}"
                echo message
                // TODO: Add Slack/Email notification for failure
                // slackSend(message: message, channel: '#deployments', color: 'danger')
            }
        }
        unstable {
            echo '⚠️ Pipeline completed with warnings.'
        }
    }
}
