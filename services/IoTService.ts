/**
 * IoTService - Simulates a real-time connection to a wearable or IoT device.
 * 
 * --- MQTT CONNECTION INSTRUCTIONS (For testing with a real broker) ---
 * To connect to an MQTT broker instead of the simulated WebSocket:
 * 1. Install an MQTT library: `npm install paho-mqtt` or `npm install mqtt` (for React Native, `paho-mqtt` or `@stomp/stompjs` are often used with WebSockets).
 * 2. Import the library: `import Paho from 'paho-mqtt';`
 * 3. Initialize the client:
 *    `const client = new Paho.Client('test.mosquitto.org', 8081, 'react-native-client-id');`
 * 4. Set up callbacks:
 *    `client.onMessageArrived = (message) => { console.log(message.payloadString); };`
 * 5. Connect:
 *    `client.connect({ onSuccess: () => { client.subscribe('caregames/wearable/data'); } });`
 * 6. Replace the `WebSocket` logic below with the `client` logic.
 * ------------------------------------------------------------------
 */

export type IoTData = {
  heartRate: number;
  steps: number;
  temperature: number;
  timestamp: number;
};

type Listener = (data: IoTData) => void;

class IoTService {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  public connect() {
    if (this.isConnected) return;

    // Using a public echo websocket server to simulate network traffic
    this.ws = new WebSocket('wss://echo.websocket.org');

    this.ws.onopen = () => {
      this.isConnected = true;
      console.log('IoT Service Connected to WebSocket');
      
      // Start sending simulated data every 3 seconds to be echoed back
      this.simulationInterval = setInterval(() => {
        const fakeData: IoTData = {
          heartRate: Math.floor(Math.random() * (120 - 60 + 1) + 60), // 60-120 bpm
          steps: Math.floor(Math.random() * 100),
          temperature: +(Math.random() * (37.5 - 36.0) + 36.0).toFixed(1),
          timestamp: Date.now(),
        };
        this.ws?.send(JSON.stringify(fakeData));
      }, 3000);
    };

    this.ws.onmessage = (event) => {
      try {
        // It's an echo server, so it will echo our stringified object.
        // In a real MQTT/IoT scenario, this would be data from the device.
        const data: IoTData = JSON.parse(event.data);
        if (data.heartRate && data.steps) {
          this.listeners.forEach((listener) => listener(data));
        }
      } catch (e) {
        // Ignore non-JSON echo messages
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error: ', error);
      this.isConnected = false;
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected');
      this.isConnected = false;
      if (this.simulationInterval) clearInterval(this.simulationInterval);
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isConnected = false;
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getStatus() {
    return this.isConnected;
  }
}

export const ioTService = new IoTService();
