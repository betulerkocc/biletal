// ============================================================================
//  Biletal — CI/CD Pipeline (Declarative)
//  Aşamalar: Checkout → Build & Deploy (Docker) → Health Check → Smoke Test
//  Tetikleyici: GitHub webhook ("GitHub hook trigger for GITScm polling")
// ============================================================================
pipeline {
    agent any

    triggers {
        // GitHub push webhook ile otomatik tetiklenir
        githubPush()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'obilet'
        // Jenkins konteynerinden host'ta yayınlanan portlara erişim için
        // host.docker.internal kullanılır (compose'da host-gateway tanımlı).
        BASE_URL  = 'http://host.docker.internal:8000'
        FRONT_URL = 'http://host.docker.internal:8082'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Kaynak kod alınıyor...'
                checkout scm
                sh 'git log -1 --oneline || true'
            }
        }

        stage('Build & Deploy (Docker Compose)') {
            steps {
                echo '🐳 Tüm servisler Docker ile derlenip ayağa kaldırılıyor...'
                // İsim çakışmasını önle (manuel başlatılmış stack varsa temizle)
                sh '''
                  docker rm -f obilet-mongo obilet-redis obilet-rabbitmq \
                               obilet-backend obilet-worker obilet-frontend 2>/dev/null || true
                  docker compose down --remove-orphans || true
                  docker compose up -d --build
                '''
                sh 'docker compose ps'
            }
        }

        stage('Health Check') {
            steps {
                echo '🩺 Servis sağlığı kontrol ediliyor...'
                sh '''
                  echo "Backend (Mongo/Redis/RabbitMQ) hazır olması bekleniyor..."
                  ok=0
                  for i in $(seq 1 40); do
                    if curl -fsS "$BASE_URL/health" 2>/dev/null | grep -q '"mongodb": *"up"'; then
                      ok=1; break
                    fi
                    sleep 3
                  done
                  [ "$ok" = "1" ] || { echo "Backend sağlıksız!"; exit 1; }
                  echo "── /health ──"
                  curl -fsS "$BASE_URL/health"
                  echo ""
                  echo "── Frontend ──"
                  curl -fsS -o /dev/null -w "Frontend HTTP %{http_code}\\n" "$FRONT_URL"
                '''
            }
        }

        stage('Smoke Test (REST API)') {
            steps {
                echo '🧪 Uçtan uca REST API testleri çalıştırılıyor...'
                sh 'bash scripts/smoke_test.sh'
            }
        }
    }

    post {
        success {
            echo '✅ PIPELINE BAŞARILI — tüm servisler ayakta, 10 uç nokta + Redis + RabbitMQ doğrulandı.'
        }
        failure {
            echo '❌ PIPELINE BAŞARISIZ — son loglar:'
            sh 'docker compose logs --tail=60 || true'
        }
        always {
            sh 'docker compose ps || true'
        }
    }
}
