# :poop: Видео-чат на Django
> Pet-проект. Создается в целях более лучшего изучения Django :shipit:

## :triangular_ruler: Стек проекта: 
- Python 3.11 (Django, Django channels)
- HTML5, CSS (Bootstrap 5, UIkit), JS (jQuery)
- NGNIX, Daphne
- Redis (v5.0.9 Важно!)

## :package: [Зависимости проекта](https://github.com/Re-Gelu/Django-WebRTC-project/blob/master/requirements.txt)

## :wrench: Запуск проекта

- Создаём виртуальное окружение Python и активируем его

  ```
  $ python -m venv venv
  $ venv\Scripts\activate.bat - для Windows / source venv/bin/activate - для Linux и MacOS
  ```

- Устанавливаем зависимости проекта

  ```
  $ pip install -r requirements.txt
  ```
  
- Обычный запуск (произойдет через Daphne)

  ```
  $ python manage.py runserver
  ``` 
  
> И определенно стоит настроить .env файл перед запуском

## :whale: Работа с Docker

- Поднять контейнер (prod/dev - .env)
  ```
  $ docker-compose -f docker-compose.yml up -d --build
  ```
  
- Удаление контейнеров
  ```
  $ docker-compose down -v
  ```
  
## :camera: Скрины проекта

![image](https://user-images.githubusercontent.com/75813517/204701587-b93f8d0f-cbaf-468e-8140-9932e4bcfbe9.png)

![image](https://user-images.githubusercontent.com/75813517/204701691-264a4296-ab51-41ad-8d89-b2ef8f111e1b.png)

