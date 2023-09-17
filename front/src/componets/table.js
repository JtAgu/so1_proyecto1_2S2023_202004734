import { useEffect,useState } from "react";
import Actions from "./actions";
import './table.css';

const headers = [
    { name: 'Titulo' },
    { name: 'Artista' },
    { name: 'Año' },
    { name: 'Género' }
  ]

export default function Table() {
    const [loading, setLoading] = useState(true);
    const [albums,setAlbums] = useState();
    var Albums=[];
      
    useEffect(() => {
        const getAlbums = () => {
            fetch('http://localhost:9000/album/api/all')
            .then(res => res.json())
            .then(res => {      
                if(res.length > 0) {
                    res.forEach(element => {
                        Albums.push(element)
                    });
                    setAlbums(Albums)
                    setLoading(false);
                }
            })
        }
        getAlbums()})

    return (
        <div>
            <table className="table text-gray-400 border-separate space-y-6 text-sm">
                    <thead className="bg-gray-900 text-gray-400">
                        <tr>
                            {headers.map((item) => (
                                <th 
                                    className="p-3 text-center font-bold"
                                    key={item.name}>{item.name}
                                </th>
                            ))}
                            <th className="p-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800">
                        {   loading ? ( <p className="p-3 font-bold">Cargando...</p>):
                            albums.map(c =>(
                                <tr key={c.Id_Proceso} className="hover:bg-gray-700">
                                    <td className="p-3">{c.PID}</td>
                                    <td className="p-3">{c.Name}</td>
                                    <td className="p-3">{c.User}</td>
                                    <td className="p-3">{c.value}</td>
                                    <td className="p-3">{Math.round(c.Memory/(1024*1024)/(100-c.RAM)*100)}</td>
                                    <Actions/>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                
        </div>
  )
}