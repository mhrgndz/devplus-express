import amqp from "amqplib"
import * as dotenv from 'dotenv';

dotenv.config();

class RabbitMQ { 

  constructor() {
    this.connectionQuery = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_URL}:${process.env.RABBITMQ_PORT}`;
    this.checkConnection();
  }

  checkConnection = () => {
    try {
      if(!this.connection || !this.connection.isConnected){
        this.connection = amqp.connect(this.connectionQuery);
      }
    } catch (error) {
      console.log('Hata:', error.message);
    }
  }
} 

export default RabbitMQ;