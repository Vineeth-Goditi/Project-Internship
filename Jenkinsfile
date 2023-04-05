pipeline {
    agent any
    tools {
        nodejs "16.0.0"
    }
    stages {
        stage('Git') {
            steps {
                git 'https://github.com/Shimam5/maoFrontend.git'
            }
        }
        stage('Install dependencies') {
            steps {
                sh 'npm install'
                sh 'npm run dev'
            }
        }
    }
}
