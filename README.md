# :poop: Видео-чат на Django
> Pet-проект. Создается в целях более лучшего изучения Django :shipit:

## :triangular_ruler: Стек проекта: 
- Python, Django, Django channels
- HTML5, CSS (Bootstrap 5, UIkit), JS
- NGNIX, Daphne
- Redis (v5.0.9 Важно!)

## :package: [Зависимости проекта](https://github.com/Re-Gelu/Django-WebRTC-project/blob/master/requirements.txt)

## :whale: Работа с Docker

- Удаление контейнеров

  ```
  $ docker-compose down -v
  ```

- Поднять Dev контейнер
  ```
  $ docker-compose -f docker-compose.yml up -d --build
  ```

- Поднять Prod контейнер
  ```
  $ docker-compose -f docker-compose.prod.yml up -d --build
  $ docker-compose -f docker-compose.prod.yml exec web python manage.py migrate --noinput
  $ docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --no-input --clear
  ```
