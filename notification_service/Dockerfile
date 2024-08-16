FROM python:3.8-slim

WORKDIR /docker-flask

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 80 8090

CMD ["python3", "-u", "server.py"]
