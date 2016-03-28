(function(){
        var apiKey = "";

        function capitalizeIt(texto) {
            return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
        }

        function horaEstimada() {
            var hora = new Date();
            var horaCalculada = hora.getHours() - 2;
            return "hora" + horaCalculada;
        }

        function diaSemana(incremento) {
            var dia = new Date();
            dia.setDate(dia.getDate() + (incremento || 0));
            dia = dia.getDay();
            var semana = new Array(7);
            semana[0] = "Domingo";
            semana[1] = "Lunes";
            semana[2] = "Martes";
            semana[3] = "Miércoles";
            semana[4] = "Jueves";
            semana[5] = "Viernes";
            semana[6] = "Sabado";

            return semana[dia];
        }

        // Gestión de peticiones AJAX
        function peticionAjax(url) {
            var xmlHttp = new XMLHttpRequest();

            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status >= 100 && xmlHttp.status <= 300) {

                        var datosCrudos = JSON.parse(xmlHttp.responseText);
                        var datos = datosCrudos.list;


                        for (var i = 0, x = 0; x < 6; i += 6, x++) {


                                var y = x + 1;
                                var hora = datos[i].dt_txt;
                                var fecha = new Date(datos[i].dt_txt);
                                var dia = diaSemana(fecha.getDay());

                            if(x === 0){
                                
                                // Hoy
                                var contenido = '<div><h5 class="azul-madrid"><strong> Hoy (' + hora.substring(11, 16) + ')</strong></h5>';
                                contenido += '<i class="owf owf-' + datos[i].weather[0].id + ' owf-11x owf-pull-left azul-madrid "></i>';
                                contenido += '<strong class="azul-madrid cabecera-meteo">' + capitalizeIt(datos[i].weather[0].description) + '</strong><br>';
                                contenido += datos[i].main.temp + '°C<br>';
                                contenido += 'Min ' + datos[i].main.temp_min + '°C | Max ' + datos[i].main.temp_max + '°C<br>';
                                contenido += 'Hum ' + datos[i].main.humidity + '%';
                                contenido += 'Psi '+ datos[i].main.pressure + '<br>';
                                contenido += 'Viento ' + datos[i].wind.deg + '° | ' + datos[i].wind.speed + ' km/h</div><br>';
         
                                
                            } else {
                                
                                // Previsión
                                var contenido = '<div><h5><strong>' + dia + ' (' + hora.substring(11, 16) + ')</strong></h5>';
                                contenido += '<i class="owf owf-' + datos[i].weather[0].id + ' owf-11x owf-pull-left "></i>';
                                contenido += '<strong class="cabecera-meteo">' + capitalizeIt(datos[i].weather[0].description) + '</strong><br>';
                                contenido += 'Temp ' + datos[i].main.temp + '°C<br>';
                                contenido += 'Min ' + datos[i].main.temp_min + '°C | Max ' + datos[i].main.temp_max + '°C<br>';
                                contenido += 'Hum ' + datos[i].main.humidity + '%';
                                contenido += 'Psi '+ datos[i].main.pressure + '<br>';
                                contenido += 'Viento ' + datos[i].wind.deg + '° | ' + datos[i].wind.speed + ' km/h</div><br>';
                                
                            }

                                document.getElementById("col" + y).innerHTML += contenido;
                        }

                        // Petición Datos Contaminacion
                        var peticionContaminacion = new XMLHttpRequest();

                        peticionContaminacion.onreadystatechange = function() {
                            if (peticionContaminacion.readyState === 4) {
                                if (peticionContaminacion.status >= 100 && peticionContaminacion.status <= 300) {

                                    document.getElementById("cargando").style.display = 'none';
                                    document.getElementsByClassName("row")[0].style.display = 'block';
                                    document.getElementsByClassName("row")[1].style.display = 'block';
                                    var datosContaminacion = JSON.parse(peticionContaminacion.responseText);

                                    var hora = horaEstimada();
                                    
                                    var contaminacion = '<h4>Contaminación (Datos Abiertos)</h4>';
                                    contaminacion += "<p><strong>" + datosContaminacion[0].parametro + ":</strong> " + parseFloat(datosContaminacion[0][hora].valor) + "μg/m<sup>3</sup> <em>medido por " + datosContaminacion[0].tecnica + "</em></p>";

                                    for (var i = 1; i < 14; i++) {
                                        contaminacion += "<p><strong>" + datosContaminacion[i].parametro + ":</strong> " + parseFloat(datosContaminacion[i][hora].valor) + " μg/m3 <em>medido por " + datosContaminacion[i].tecnica + "</em></p>";
                                    }

                                    document.getElementById("colContaminacion").innerHTML = contaminacion;

                                } else if (peticionContaminacion.status >= 400 && peticionContaminacion.status <= 600) {
                                    console.log("ERROR AJAX: " + JSON.parse(peticionContaminacion.responseText));
                                }
                            }
                        };

                        peticionContaminacion.open("GET", "http://airemadrid.herokuapp.com/api/estacion/99", true);
                        peticionContaminacion.send();

                    } else if (xmlHttp.status >= 400 && xmlHttp.status <= 600) {
                        console.log("ERROR AJAX: " + JSON.parse(xmlHttp.responseText));
                    }
                }
            };
            xmlHttp.open("GET", url, true);
            xmlHttp.send();
        }


	var ref = new Firebase("https://agroduino.firebaseio.com/datos");
	ref.on("value", function(snapshot) {
		var datos = snapshot.val();
	  
	   // Meteo
        peticionAjax("http://api.openweathermap.org/data/2.5/forecast?lat="+datos.gps.latitud+"&lon="+datos.gps.longitud+"&cnt=60&mode=json&lang=sp&units=metric&APPID=" + apiKey);
        
        var contenidoSensores = '<div>';
        contenidoSensores += '<h4 class="azul-madrid">Sensores Clima</h4>';
        contenidoSensores += '<p><strong class="azul-madrid">Temperatura: </strong> '+datos.temperatura.valor+'°C</p>';
        contenidoSensores += '<p><strong class="azul-madrid">Humedad: </strong> '+datos.humedad.valor+'%</p>';
        contenidoSensores += '<p><strong class="azul-madrid">Lluvia (estado): </strong> '+datos.lluvia.descripcion+'</p>';
        
        if(datos.lluvia.lloviendo === 0) {
           contenidoSensores += '<p><strong class="azul-madrid">Lloviendo (ahora): </strong> No</p>'; 
        } else {
           contenidoSensores += '<p><strong class="azul-madrid">Lloviendo (ahora): </strong> Si</p>';  
        }
        
        contenidoSensores += '<h4 class="azul-madrid">Sensores Riego</h4>';
        if(datos.bomba.funcionando){
           contenidoSensores += '<p><strong class="azul-madrid">Bomba: </strong> Si</p>';  
        } else {
           contenidoSensores += '<p><strong class="azul-madrid">Bomba: </strong> No</p>'; 
        }
        
        contenidoSensores += '<p><strong class="azul-madrid">Flujo riego: </strong> '+datos.flujo.valor+' Litros/Hora</p>';
        
        contenidoSensores += '<p><strong class="azul-madrid">Humedad de la tierra: </strong> '+datos.humedadTierra.valor+'</p>';
        
        if(datos.humedadTierra.umbral){
            contenidoSensores += '<p><strong class="azul-madrid">Humedad de la tierra (umbral): </strong> No alcanzado</p>';
        } else {
            contenidoSensores += '<p><strong class="azul-madrid">Humedad de la tierra (umbral): </strong> Sobrepasado</p>';
        }
        
        contenidoSensores += '<h4 class="azul-madrid">Datos GPS ('+datos.gps.satelites+')</h4>';
        contenidoSensores += '<p><strong class="azul-madrid">Longitud: </strong> '+datos.gps.longitud+'</p>';
        contenidoSensores += '<p><strong class="azul-madrid">Latitud: </strong> '+datos.gps.latitud+'</p>';
        contenidoSensores += '<p><strong class="azul-madrid">Altitud: </strong> '+datos.gps.altitud+'m</p>';
        contenidoSensores += '<p><strong class="azul-madrid">Orientacion: </strong> '+datos.gps.rumbo+'°</p>';
        
        contenidoSensores += '</div>';
        document.getElementById("colAhora").innerHTML = contenidoSensores;
        
	}, function (errorObject) {
	    console.log("ERROR de lectura: " + errorObject.code);
	});
})();