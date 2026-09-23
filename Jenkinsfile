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
        stage('Checkout dev') {
            steps {
                git branch: 'dev',
                    url: 'git@github.com:Pedro-Appel/codign-tycoon.git',
                    credentialsId: 'git-checkout-key'
            }
        }

        stage('Validate') {
            parallel {
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            // sh 'npm ci'
                            sh 'npm run lint'
                            // sh 'npm test'
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh './mvnw -B test'
                        }
                    }
                }
            }
        }

        stage('Await approval to merge into staging') {
            options {
                timeout(time: 24, unit: 'HOURS')
            }
            steps {
                input message: "Validations passed for dev @ ${env.GIT_COMMIT?.take(7)}. Merge into staging and deploy?",
                      ok: 'Merge & Deploy'
                      // submitter: 'youruser'   // uncomment + set to restrict who can approve
            }
        }

        stage('Merge dev into staging') {
            steps {
                sshagent(credentials: ['git-checkout-key']) {
                    sh """
                        git config user.email "jenkins@mecha-rat"
                        git config user.name  "Jenkins"
                        git fetch origin staging
                        git checkout staging
                        git pull origin staging
                        git merge --no-ff origin/dev -m "Merge dev into staging (build #${env.BUILD_NUMBER})"
                        git push origin staging
                    """
                }
            }
        }

        stage('Prepare environment file') {
            steps {
                withCredentials([file(credentialsId: 'staging-env-file', variable: 'ENVFILE')]) {
                    sh 'cp "$ENVFILE" .env'
                }
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
            echo "dev validated, merged into staging, and deployed (build #${env.BUILD_NUMBER})"
        }
        aborted {
            echo "Merge/deploy was declined, or the approval window timed out. Nothing was merged or deployed."
        }
        failure {
            echo "Pipeline FAILED — check which stage: validation, merge, build, or deploy."
        }
    }
}
