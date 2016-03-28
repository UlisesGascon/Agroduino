// Version 1.0.0 - Development

// Librerías
#include "DHT.h"

// DHT22
#define PINDHT 5
#define DHTTYPE DHT22
DHT dht(PINDHT, DHTTYPE);

// Relé
#define releAgua  4

// Lluvia
const int sensorMin = 0;     // sensor minimum
const int sensorMax = 1024;  // sensor maximum

// LED RGB
int ledRojo = 10;
int ledVerde = 9;
int ledAzul = 11;  

// calculo litros hora
volatile int flow_frequency;
unsigned int l_hour;
unsigned char flowsensor = 2;
unsigned long currentTime;
unsigned long cloopTime;

void flow () {
   flow_frequency++;
}


void setup()
{
  // RGB LED
  pinMode(ledRojo,OUTPUT);  //El LED Rojo como una salida
  pinMode(ledVerde,OUTPUT); //El LED Verde como una salida
  pinMode(ledAzul,OUTPUT);  //El LED Azul como una salida
  // Relé
  pinMode(releAgua, OUTPUT);
  // Humedad Tierra
  pinMode(7, INPUT);
  // arrancar DHT22
  dht.begin();
   // calculo litros hora
  pinMode(flowsensor, INPUT);
  digitalWrite(flowsensor, HIGH); // Optional Internal Pull-Up
  attachInterrupt(0, flow, RISING); // Setup Interrupt
  sei(); // Enable interrupts
  currentTime = millis();
  cloopTime = currentTime;
  // Enciende Agua
  digitalWrite(releAgua,LOW); 
  // Serial
  Serial.begin(9600);

}

void loop()
{
  // Ritmo Refresco;
  delay(1000);

  // RGB Errores
  bool errores = false;
  
  // Lluvia
  int sensorLluvia = analogRead(A0);
  int rango = map(sensorLluvia, sensorMin, sensorMax, 0, 10);
  String estadoLluvia = "";
  bool lloviendo = false;
  
  // DHT22 y AM2302
  int humedad = dht.readHumidity();
  int temperatura = dht.readTemperature();
  String datos;

  // Humedad Tierra
  int humedadTierra = analogRead(A1);
  String humedadUmbral = "false";
  
  // ERRORES
  if(digitalRead(releAgua) && l_hour > 0){
    errores = true;
  }
 
  // ERRORES - RGB
  if(!errores){
    color(0,255,0); // VERDE
  } else {
    color(255,0,0); // ROJO
  };
  
  // Humedad Tierra
  if(digitalRead(7) == 0){
    humedadUmbral = "true";
  }

  // calculo litros hora
  currentTime = millis();

  if(currentTime >= (cloopTime + 1000)){
    cloopTime = currentTime; // Updates cloopTime
      // Pulse frequency (Hz) = 7.5Q, Q is flow rate in L/min.
    l_hour = (flow_frequency * 60 / 7.5); // (Pulse frequency x 60 min) / 7.5Q = flowrate in L/hour
    flow_frequency = 0; // Reset Counter
  }

  // Lluvia
  if(rango <= 5){
    estadoLluvia = "Seco";
    lloviendo = false;
    digitalWrite(releAgua,HIGH); // Apaga Riego
  } else if( rango >= 6 && rango <= 8) {
    lloviendo = false;
    estadoLluvia = "Chispea"; // Mantiene el Riego
  } else {
    estadoLluvia = "Lloviendo";
    lloviendo = true;
    digitalWrite(releAgua,LOW); // Encender Riego
  }



  // DATOS (JSON)
  String jsonSerial = "{";
  
  // Errores
  if(errores){
    jsonSerial += "\"errores\": true,";
  } else {
    jsonSerial += "\"errores\": false,";
  }

  // Humedad de la tierra

    jsonSerial += "\"humedadTierra\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"valor\":";
    jsonSerial += String(humedadTierra);
    jsonSerial += ", \"umbral\":";
    jsonSerial += humedadUmbral; 
    jsonSerial += "},";

  // Flujo
  if (isnan(l_hour)) {
    
    jsonSerial += "\"flujo\": {";
    jsonSerial += "\"valido\": false,";
    jsonSerial += "\"error\": \"Valor númerico no valido\"";
    jsonSerial += "},";
  
  } else {

    jsonSerial += "\"flujo\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"valor\":";
    jsonSerial += l_hour, DEC;
    jsonSerial += ", \"unidad\": \"Litros/Hora\"";  
    jsonSerial += "},";
  };

  // Bomba
  if(digitalRead(releAgua)){
    jsonSerial += "\"bomba\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"funcionando\": true";
    jsonSerial += "},";
  } else {
    jsonSerial += "\"bomba\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"funcionando\": false";
    jsonSerial += "},";
  }

  // LLuvia
    jsonSerial += "\"lluvia\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"descripcion\": \"";
    jsonSerial += String(estadoLluvia);
    jsonSerial += "\", \"lloviendo\":";
    jsonSerial += lloviendo;
    jsonSerial += "},";

  // Temperatura y Humedad
  if (isnan(temperatura) || isnan(humedad)) {
    
    jsonSerial += "\"humedad\": {";
    jsonSerial += "\"valido\": false,";
    jsonSerial += "\"error\": \"Valor númerico no valido\"";
    jsonSerial += "},";
    jsonSerial += "\"temperatura\": {";
    jsonSerial += "\"valido\": false,";
    jsonSerial += "\"error\": \"Valor númerico no valido\"";   
    jsonSerial += "}"; 

  } else {

    jsonSerial += "\"humedad\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"valor\":";
    jsonSerial += humedad;
    jsonSerial += ", \"unidad\": \"%\"";  
    jsonSerial += "},";
    
    jsonSerial += "\"temperatura\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"valor\":";
    jsonSerial += temperatura;
    jsonSerial += ", \"unidad\": \"C\"";    
    jsonSerial += "},";  

  }

  // GPS (SIMULACIÓN)
    jsonSerial += "\"gps\": {";
    jsonSerial += "\"valido\": true,";
    jsonSerial += "\"latitud\": 40.418889,";
    jsonSerial += "\"longitud\": -3.691944,";
    jsonSerial += "\"rumbo\": 45,";
    jsonSerial += "\"altitud\": 1308,";
    jsonSerial += "\"satelites\": 4,";
      
      jsonSerial += "\"fecha\": {";
      jsonSerial += "\"dia\": \"DDMMYY\",";
      jsonSerial += "\"hora\": \"HHMMSSCC\"";
      jsonSerial += "},";

      jsonSerial += "\"velocidad\": {";
      jsonSerial += "\"mps\": 100,";
      jsonSerial += "\"kmh\": 1";
      jsonSerial += "}";
    
    jsonSerial += "}";

  jsonSerial += "}";

  // Impresión
  Serial.println(jsonSerial);

}

// RGB COLOR
void color(int rojo, int verde, int azul){
     analogWrite(ledRojo, rojo);
     analogWrite(ledVerde, verde);
     analogWrite(ledAzul, azul);
  /* RGB
  - ROJO
  color(255,0,0);
  
  - VERDE
  color(0,255,0);
  
  - AZUL
  color(0,0,255);
  
  - CYAN
  color(0,255,255);
  
  - MAGENTA
  color(255,0,255);
  
  - AMARILLO
  color(255,255,0);
  */
}
