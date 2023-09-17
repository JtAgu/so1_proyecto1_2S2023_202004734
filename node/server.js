const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const axios = require('axios');
require('dotenv').config();
const app = express();
const port = 8000;

const mysql = require('mysql2');

// Configura la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// Conecta a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos MySQL');
  }
});

module.exports = connection;



app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev')); 

app.get('/', (req, res) => {
    const jsonData = {
        mensaje: 'Hola Mundo',
        fecha: new Date()
      };
    
      // Usamos res.json() para enviar la respuesta en formato JSON
      res.json(jsonData);
});

app.post('/insert_process', (req, res) => {
  //const procesos = JSON.parse(req.body.process.replace(",}","}")).procesos;
  const procesos = req.body.process.procesos;
  const instance = req.body.instance;

  const deleteChildSQL = `
    DELETE FROM Child
      WHERE ProcessId IN (
        SELECT Id
        FROM Process
        WHERE Instance = '${instance}'
      )
  `;

  const deleteProcessSQL = `
    DELETE FROM Process
      WHERE Instance = '${instance}'
  `;

  const deleteChildPromise = new Promise((resolve, reject) => {
    dbConnection.query(deleteChildSQL, (deleteChildErr, deleteChildResult) => {
      if (deleteChildErr) {
        console.error('Error al eliminar registros de Child:', deleteChildErr);
        reject(deleteChildErr);
      } else {
        console.log('Registros de Child eliminados correctamente');
        resolve();
      }
    });
  });

  const deleteProcessPromise = new Promise((resolve, reject) => {
    dbConnection.query(deleteProcessSQL, (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Error al vaciar la tabla Process:', deleteErr);
        reject(deleteErr);
      } else {
        console.log('Tabla Process vaciada correctamente');
        resolve();
      }
    });
  });

  Promise.all([deleteChildPromise, deleteProcessPromise])
  .then(() => {
    procesos.forEach((proceso) => {
      const { Pid, Nombre, Usuario, Estado, Memoria, Hijos } = proceso;
      if (Pid && Nombre && Usuario !== null && Estado !== null && Memoria !== null) {
        const processQuery = `INSERT INTO Process (PID, Name, User, Memory, State, Instance, Ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        dbConnection.query(processQuery, [Pid, Nombre, Usuario, Memoria, Estado, instance, req.ip], (err, results) => {
          if (err) {
            console.error('Error al insertar en la tabla Process:', err);
            res.status(500).json({ error: 'Error al insertar datos' });
          } else {
            const processId = results.insertId;
  
            if (Hijos && Hijos.length > 0) {
              Hijos.forEach((hijo) => {
                const { Pid, Nombre } = hijo;
                if (Pid && Nombre) {
                  const childQuery = `INSERT INTO Child (PID, Name, ProcessId) VALUES (?, ?, ?)`;
                  dbConnection.query(childQuery, [Pid, Nombre, processId], (childErr) => {
                    if (childErr) {
                      console.error('Error al insertar en la tabla Child:', childErr);
                    }
                  });
                }
              });
            }
          }
        });
      } else {
        console.error('Los campos del proceso son nulos o vacíos. No se realizará la inserción.');
      }
    });  
  })
  .catch((error) => {
    console.error('Error durante la eliminación:', error);
  });

  const cpuSQL = 'INSERT INTO CPU (FechaHora, Porcentaje, Instance) VALUES (?, ?, ?)';
  dbConnection.query(cpuSQL, [new Date(), parseFloat(req.body.cpu), instance], (err, result) => {
    if (err) {
      console.error('Error al insertar en la tabla CPU:', err);
      res.status(500).send('Error al insertar en la tabla CPU');
      return;
    }
    console.log('Valor insertado correctamente en la tabla CPU');
  });

  //const { Total, Libre, Compartida, Buffer } = JSON.parse(req.body.ram.replace(",}","}"));
  const { Total, Libre, Compartida, Buffer } = req.body.ram;
  const insertSQL = 'INSERT INTO RAM (FechaHora, Porcentaje, Instance) VALUES (NOW(), ?, ?)';
  const porcentaje =((Total - Libre) / Total * 100).toFixed(2);
  dbConnection.query(insertSQL, [parseFloat(porcentaje), instance], (err, result) => {
    if (err) {
      console.error('Error al insertar en la tabla RAM:', err);
    } else {
      console.log('Valores insertados correctamente en la tabla RAM');
    }
  });

  res.json({ message: 'Datos insertados con éxito' });
});

app.get('/kil_process', (req, res)=> {
  const data = req.body
  axios.get(`http://${data.Ip_address}:9000/process/api/kiltask/${data.PID}`)
    .then((response) => {
      console.log(response.data, response.status);
      res.json({...response.data});
    })
    .catch((error) => {
      console.error(`Error al hacer la solicitud: ${error.message}`);
      res.json(error);
    });
})

app.get('/getCpu/:id', (req, res) => {
  const instance = req.params.id;
  const sqlQuery = `SELECT Porcentaje FROM CPU WHERE instance='${instance}' ORDER BY Id DESC LIMIT 1`;

  dbConnection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta SQL:', err);
      res.status(500).json({ error: 'Error al obtener el porcentaje de CPU' });
    } else {
      if (results.length > 0) {
        const porcentaje = parseFloat(results[0].Porcentaje);
        res.json({ porcentaje });
      } else {
        res.status(404).json({ error: 'No se encontraron registros en la tabla CPU' });
      }
    }
  });
});

app.get('/getRam/:id', (req, res) => {
  const instance = req.params.id;
  const sqlQuery = `SELECT Porcentaje FROM RAM WHERE instance='${instance}' ORDER BY Id DESC LIMIT 1`;

  dbConnection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta SQL:', err);
      res.status(500).json({ error: 'Error al obtener el porcentaje de RAM' });
    } else {
      if (results.length > 0) {
        const porcentaje = parseFloat(results[0].Porcentaje);
        res.json({ porcentaje });
      } else {
        res.status(404).json({ error: 'No se encontraron registros en la tabla RAM' });
      }
    }
  });
});

app.get('/cpu-data/:id', (req, res) => {
  const instance = req.params.id;
  const sqlQuery =  `SELECT TIME(FechaHora) AS Hora, Porcentaje FROM CPU WHERE instance='${instance}' LIMIT 25 `;

  dbConnection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta SQL:', err);
      res.status(500).json({ error: 'Error al obtener datos de CPU' });
    } else {
      if (results.length > 0){
        labels = [];
        data = [];
        results.forEach(r => {
          labels.push(r.Hora);
          data.push(parseFloat(r.Porcentaje));
        });
        res.json({labels,data});
      }else {
        res.status(404).json({ error: 'No se encontraron registros en la tabla CPU' });
      }
    }
  });
});

app.get('/ram-data/:id', (req, res) => {
  const instance = req.params.id;
  const sqlQuery =  `SELECT TIME(FechaHora) AS Hora, Porcentaje FROM RAM WHERE instance='${instance}' LIMIT 25 `;

  dbConnection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta SQL:', err);
      res.status(500).json({ error: 'Error al obtener datos de RAM' });
    } else {
      if (results.length > 0){
        labels = [];
        data = [];
        results.forEach(r => {
          labels.push(r.Hora);
          data.push(parseFloat(r.Porcentaje));
        });
        res.json({labels,data});
      }else {
        res.status(404).json({ error: 'No se encontraron registros en la tabla RAM' });
      }
    }
  });
});

// Función para obtener registros de Child por ProcessId
function getChildRecords(processId) {
  return new Promise((resolve, reject) => {
    const sqlQuery = `SELECT * FROM Child WHERE ProcessId = ? LIMIT 10`;
    dbConnection.query(sqlQuery, [processId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Ruta GET para obtener datos de Process con Child
app.get('/process/:id', async (req, res) => {
  try {
    const instance = req.params.id;
    const sqlQuery =  `SELECT * FROM Process WHERE instance='${instance}' LIMIT 10`;
    const processResults = await new Promise((resolve, reject) => {
      dbConnection.query(sqlQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const processWithChild = [];
    for (const processRecord of processResults) {
      const childRecords = await getChildRecords(processRecord.Id);
      processRecord.Child = childRecords;
      processWithChild.push(processRecord);
    }

    res.json(processWithChild);
  } catch (error) {
    console.error('Error al obtener datos de Process con Child:', error);
    res.status(500).json({ error: 'Error al obtener datos de Process con Child' });
  }
});

app.get('/unique-instances', (req, res) => {
  const sqlQuery = 'SELECT DISTINCT Instance, Ip_address FROM Process';

  dbConnection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta SQL:', err);
      res.status(500).json({ error: 'Error al obtener valores únicos de Instance' });
    } else {
      res.json(results);
    }
  });
});

app.get('/mi_ruta', (req, res) => {
  const ip_cliente = req.ip;
  console.log(typeof(ip_cliente))
  res.send(`La dirección IP del cliente es: ${ip_cliente}`);
});

app.listen(port, () => {
  console.log(`Server Express listeningo on port ${port}`);
});
