import { useEffect, useState } from "react"
import { LineChart } from "./linechart"
import { Typography, Select, Option } from "@material-tailwind/react"
import { useMaterialTailwindController } from "../context"
import { RenderAlert } from "../commons/functions"

export default function History(){
    const {controller, dispatch} = useMaterialTailwindController()
    const [instance, setInstance] = useState([])
    const [value, setValue] = useState('--')
    const [cpu, setCpu] = useState({"labels":[],"data":[]})
    const [ram, setRam] = useState({"labels":[],"data":[]})

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
        fetch(`http://127.0.0.1:8000/CPUHistorial/${e}`)
            .then(res => res.json())
            .then(data => {console.log(data);setCpu(data)})
            .catch(e => {
                console.error(e)
                RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
            })
        fetch(`http://127.0.0.1:8000/RamHistorial/${e}`)
            .then(res => res.json())
            .then(data => {console.log(data);setRam(data)})
            .catch(e => {
                console.error(e)
                RenderAlert(dispatch,'error','Ocurrió un error al crear la cuenta, intente nuevamente')
            })
    }
    return(
        <>
            <Typography variant="h1" className="text-sound-100">History</Typography>
            <div className="grid grid-cols-1 mt-5">
                <div className="bg-sound-100 p-10">
                <Select label="Seleccionar instancia" value={value} onChange={(value) => handleSelect(value)}>
                    <Option value="--"> -- </Option>
                    {instance && instance.map(({Instance}, index) => {
                        return <Option key={index} value={Instance}>{Instance}</Option>
                    })}
                </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 mt-5">
                <div className="bg-sound-100 p-10 text-center">
                    <Typography variant="h3">CPU</Typography>
                    <LineChart dataset={cpu}/>
                </div>
                <div className="bg-sound-100 p-10 text-center">
                    <Typography variant="h3">Memoria RAM</Typography>
                    <LineChart dataset={ram}/>
                </div>
            </div>
        </>
    )
}