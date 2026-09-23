pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_ONLY',
            defaultValue: false,
            description: 'Skip validate/approval/merge — check out staging as-is and just build + deploy'
        )
    }

    environment {
        DEPLOY_HOST = 'staging-deploy'          // SSH alias, see step 5
        DEPLOY_PATH = '~/staging/myapp'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout dev') {
            when { expression { !params.DEPLOY_ONLY } }
            steps {
                git branch: 'dev',
                    url: 'git@github.com:Pedro-Appel/codign-tycoon.git',
                    credentialsId: 'git-checkout-key'
            }
        }

        stage('Validate') {
            when { expression { !params.DEPLOY_ONLY } }
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
            when { expression { !params.DEPLOY_ONLY } }
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
            when { expression { !params.DEPLOY_ONLY } }
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

        stage('Checkout staging (deploy-only)') {
            when { expression { params.DEPLOY_ONLY } }
            steps {
                git branch: 'staging',
                    url: 'git@github.com:Pedro-Appel/codign-tycoon.git',
                    credentialsId: 'git-checkout-key'
            }
        }

        stage('Prepare environment file') {
            steps {
                withCredentials([file(credentialsId: 'staging-env-file', variable: 'ENVFILE')]) {
                    sh 'cp "$ENVFILE" .env'
                    sh 'chmod 600 .env'
                }
            }
        }


        stage('Build images') {
            steps {
                withCredentials([file(credentialsId: 'staging-env-file', variable: 'ENVFILE')]) {
                    sh "scp \$ENVFILE ${DEPLOY_HOST}:${DEPLOY_PATH}/.env"
                }
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
            echo params.DEPLOY_ONLY
                ? "staging redeployed as-is (build #${env.BUILD_NUMBER}, no merge)"
                : "dev validated, merged into staging, and deployed (build #${env.BUILD_NUMBER})"
        }
        aborted {
            echo "Merge/deploy was declined, or the approval window timed out. Nothing was merged or deployed."
        }
        failure {
            echo "Pipeline FAILED — check which stage: validation, merge, build, or deploy."
        }
        cleanup {
            // Runs last, after whichever of the above fired, regardless of
            // outcome — wipes node_modules, Maven target/, and (importantly)
            // the .env file containing secrets, so none of it lingers under
            // $JENKINS_HOME/workspace between runs. Built into Pipeline:
            // Basic Steps, already available — no extra plugin needed.
            deleteDir()
        }
    }
}
