pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DEPLOY_HOST = 'staging-deploy'          // SSH alias, see step 5
        DEPLOY_PATH = '~/staging/myapp'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'staging',
                    url: 'git@github.com:Pedro-Appel/codign-tycoon.git',
                    credentialsId: 'git-checkout-key'
            }
        }

        stage('Build images') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} build"
            }
        }

        stage('Sync code to staging host') {
            steps {
                sshagent(credentials: ['staging-ssh-key']) {
                    sh """
                        ssh ${DEPLOY_HOST} "mkdir -p ${DEPLOY_PATH}"
                        rsync -az --delete \
                            --exclude '.git' \
                            ./ ${DEPLOY_HOST}:${DEPLOY_PATH}/
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'staging-env-file', variable: 'ENVFILE')]) {
                    sh "scp \$ENVFILE ${DEPLOY_HOST}:${DEPLOY_PATH}/.env"
                }
                sshagent(credentials: ['staging-ssh-key']) {
                    sh """
                        ssh ${DEPLOY_HOST} '\
                            cd ${DEPLOY_PATH} && \
                            docker compose -f ${COMPOSE_FILE} pull --ignore-pull-failures && \
                            docker compose -f ${COMPOSE_FILE} up -d --build --remove-orphans \
                        '
                    """
                }
            }
        }

        stage('Health check') {
            steps {
                sshagent(credentials: ['staging-ssh-key']) {
                    sh """
                        sleep 5
                        ssh ${DEPLOY_HOST} 'docker compose -f ${DEPLOY_PATH}/${COMPOSE_FILE} ps'
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Staging deploy succeeded: build #${env.BUILD_NUMBER}"
        }
        failure {
            echo "Staging deploy FAILED — check console log."
        }
    }
}
