package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
)

type MQTTClient struct {
	client paho.Client
}

func NewMQTTClient() *MQTTClient {
	brokerURL := os.Getenv("MQTT_URL")
	clientID := os.Getenv("MQTT_CLIENT_ID")
	if clientID == "" {
		clientID = "com-service"
	}

	opts := paho.NewClientOptions()
	opts.AddBroker(brokerURL)
	opts.SetClientID(clientID)
	opts.SetCleanSession(true)
	opts.SetAutoReconnect(true)
	opts.SetConnectTimeout(10 * time.Second)
	opts.SetOnConnectHandler(func(c paho.Client) {
		log.Println("MQTT conectado")
	})
	opts.SetConnectionLostHandler(func(c paho.Client, err error) {
		log.Printf("MQTT conexión perdida: %v", err)
	})

	client := paho.NewClient(opts)
	token := client.Connect()
	token.Wait()

	if err := token.Error(); err != nil {
		log.Fatalf("Error conectando a MQTT: %v", err)
	}

	return &MQTTClient{client: client}
}

func (m *MQTTClient) Publish(topic string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando payload: %w", err)
	}

	token := m.client.Publish(topic, 1, false, data)
	token.Wait()
	return token.Error()
}

func (m *MQTTClient) Subscribe(topic string, handler paho.MessageHandler) error {
	token := m.client.Subscribe(topic, 1, handler)
	token.Wait()
	return token.Error()
}

func (m *MQTTClient) Disconnect() {
	m.client.Disconnect(250)
}