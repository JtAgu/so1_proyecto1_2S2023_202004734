package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"time"

	"log"
	"strings"

	"github.com/gorilla/mux"

	_ "github.com/jinzhu/gorm/dialects/mysql"

	"github.com/gorilla/handlers"
)

type Procesos struct {
	PID     int     `json:"PID"`
	Nombre  string  `json:"Nombre"`
	Usuario int     `json:"Usuario"`
	Memoria int     `json:"Memoria"`
	Estado  string  `json:"Estado"`
	Childs  []Child `json:"childs"`
}

type Child struct {
	PID    int    `json:"PID"`
	Nombre string `json:"Nombre"`
}

type CPU struct {
	FechaHora  time.Time `json:"Fecha"`
	Porcentaje float64   `json:"Porcentaje"`
}

type RAM struct {
	FechaHora  time.Time `json:"Fecha"`
	Porcentaje float64   `json:"Porcentaje"`
}

type Data struct {
	Procesos []Procesos `json:"Proceso"`
	CPU      CPU        `json:"CPU"`
	RAM      RAM        `json:"RAM"`
}

type Root struct {
	Data Data `json:"data"`
}

type Response struct {
	Status  bool   `json:"Estado"`
	Message string `json:"message"`
}

func SendResponse(write http.ResponseWriter, status int, data []byte) {
	write.Header().Set("Content-Type", "application/json")
	write.WriteHeader(status)
	write.Write(data)
}

func SendError(write http.ResponseWriter, status int) {
	data := []byte(`{}`)
	write.Header().Set("Content-Type", "application/json")
	write.WriteHeader(status)
	write.Write(data)
}

func SetProcessRoutes(router *mux.Router) {
	subRoute := router.PathPrefix("/process/api").Subrouter()
	subRoute.HandleFunc("/kiltask/{id}", EliminarProceso).Methods("GET")
}

func EliminarProceso(writer http.ResponseWriter, request *http.Request) {
	response := Response{}

	id := mux.Vars(request)["id"]

	out, err := exec.Command("kill", "-9", id).Output()
	if err != nil {
		fmt.Print("Failed to execute command: kill ")
		response.Status = false
		SendError(writer, http.StatusInternalServerError)
		return
	}
	response.Message = string(out)
	json, _ := json.Marshal(response)
	SendResponse(writer, http.StatusOK, json)

}

func main() {
	// Configura un temporizador para realizar la solicitud POST cada 30 segundos
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Función para realizar la solicitud POST
	doPOST := func() {
		url := "http://localhost:8000/insert_process"

		ram := exec.Command("sh", "-c", "cat /proc/ram_202004734")
		out_ram, err := ram.CombinedOutput()
		if err != nil {
			fmt.Println(err)
		}

		proc := exec.Command("sh", "-c", "cat /proc/cpu_202004734")
		out_proc, err := proc.CombinedOutput()
		if err != nil {
			fmt.Println(err)
		}

		cpu := exec.Command("sh", "-c", "top -bn 1 -i -c | head -n 3 | tail -1 | awk {'print $8'}")
		out_cpu, err := cpu.CombinedOutput()
		if err != nil {
			fmt.Println(err)
		}

		instance := exec.Command("sh", "-c", "hostname")
		out_instance, err := instance.CombinedOutput()
		if err != nil {
			fmt.Println(err)
		}

		// Eliminar los caracteres de salto de línea '\n'
		cpuStr := strings.Replace(string(out_cpu), "\n", "", -1)
		ramStr := strings.Replace(string(out_ram), "\n", "", -1)
		procStr := strings.Replace(string(out_proc), "\n", "", -1)
		instanceStr := strings.Replace(string(out_instance), "\n", "", -1)

		// Crear un mapa para almacenar los valores
		data := map[string]string{
			"cpu":      cpuStr,
			"ram":      ramStr,
			"process":  procStr,
			"instance": instanceStr,
		}
		fmt.Println(data)
		// Convertir el mapa en una cadena JSON
		jsonData, err := json.Marshal(data)
		if err != nil {
			fmt.Println(err)
			return
		}
		// Realizar la solicitud POST con jsonData como cuerpo
		resp, err := http.Post(url, "application/json", strings.NewReader(string(jsonData)))
		if err != nil {
			fmt.Println("Error al realizar la solicitud POST:", err)
			return
		}
		defer resp.Body.Close()

		fmt.Println("Código de estado:", resp.Status)

		// Leer la respuesta si es necesario
		// ...
	}

	// Ejecuta la solicitud POST inicial
	doPOST()

	// Configura una goroutine para ejecutar la solicitud POST en intervalos de 30 segundos
	go func() {
		for {
			select {
			case <-ticker.C:
				doPOST()
			}
		}
	}()

	// Resto de tu código, como el servidor HTTP
	router := mux.NewRouter()
	SetProcessRoutes(router)

	// Middleware para habilitar CORS
	headers := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
	methods := handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE"})
	origins := handlers.AllowedOrigins([]string{"*"})

	log.Println("Server running on port 5000")
	log.Fatal(http.ListenAndServe(":5000", handlers.CORS(headers, methods, origins)(router)))
}
