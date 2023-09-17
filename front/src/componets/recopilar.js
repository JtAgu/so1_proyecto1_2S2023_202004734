import { useState, useEffect } from "react"
import { PieChart } from "./piechart"
import { Typography, Select, Option } from "@material-tailwind/react"
import { TrashIcon } from "@heroicons/react/24/solid"
import { SortableTable } from "./table"
import { useMaterialTailwindController } from "../context"
import { RenderAlert } from "../commons/functions"

export default function Monitorting(){
    const {controller, dispatch} = useMaterialTailwindController()
    const [instance, setInstance] = useState([])
    const [value, setValue] = useState('--')
    const [cpu, setCpu] = useState({"En uso":0})
    const [ram, setRam] = useState({"En uso":0})
    const [process, setProcess]= useState([])
    useEffect(()=>{
        fetch('http://127.0.0.1:8000/unique-instances')
            .then(res => res.json())
            .then(data => setInstance(data))
            .catch(e => {
                console.error(e)
                RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
            })
    }, [])
    
    const handleSelect=(e)=>{
        console.log(e)
        setValue(e)
        fetch(`http://127.0.0.1:8000/GetCpu/${e}`)
            .then(res => res.json())
            .then(data => {console.log(data);setCpu(data)})
            .catch(e => {
                console.error(e)
                RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
            })
        fetch(`http://127.0.0.1:8000/GetRam/${e}`)
            .then(res => res.json())
            .then(data => {console.log(data);setRam(data)})
            .catch(e => {
                console.error(e)
                RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
            })
        fetch(`http://127.0.0.1:8000/GetProcess/${e}`)
            .then(res => res.json())
            .then(data => setProcess(data))
            .catch(e => {
                console.error(e)
                RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
            })
    }

    const kilProcess = (e)=>{
        const selectedInstance = instance.filter((i)=>i.Instance == value)
        const requestInit = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                'ip_address':selectedInstance.Ip_address,
                'PID': e
            })
        }
        fetch(`http://127.0.0.1:8000/KillProcess`,requestInit)
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(e => {
            console.error(e)
            RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
        })
    }
    return(
        <>
            <Typography variant="h1" className="text-sound-100">Monitoring</Typography>
            <div class="grid grid-cols-1 mt-5">
                <div class="bg-sound-100 p-10">
                    <Select label="Seleccionar instancia" value={value} onChange={(value) => handleSelect(value)}>
                        <Option value="--"> -- </Option>
                        {instance && instance.map(({Instance}, index) => {
                            return <Option key={index} value={Instance}>{Instance}</Option>
                        })}
                    </Select>
                </div>
            </div>
            <div class="grid grid-cols-2 mt-5">
                <div class="bg-sound-100 p-10 text-center">
                <Typography variant="h3">CPU</Typography>
                    <PieChart dataset={cpu}/>
                </div>
                <div class="bg-sound-100 p-10 text-center">
                    <Typography variant="h3">RAM</Typography>
                    <PieChart dataset={ram}/>
                </div>
            </div>
            <div className="my-10">
                <SortableTable thead={['PID','Nombre','Usuario', 'Estado', 'RAM','Accion']} 
                                trows={process} name={"Procesos"} 
                                actions={[{'func':kilProcess,'icon':<TrashIcon className="h-4 w-4"/>, 'tool':'Kill Process'}]} ram={ram.porcentaje} kill={kilProcess}/>
            </div>
        </>
    )
}