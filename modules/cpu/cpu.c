// Info de los modulos
#include <linux/module.h>
// Info del kernel en tiempo real
#include <linux/kernel.h>
#include <linux/sched.h>

// Headers para modulos
#include <linux/init.h>
// Header necesario para proc_fs
#include <linux/proc_fs.h>
// Para dar acceso al usuario
#include <asm/uaccess.h>
// Para manejar el directorio /proc
#include <linux/seq_file.h>
// Para get_mm_rss
#include <linux/mm.h>

struct task_struct *cpu; // Estructura que almacena info del cpu

// Almacena los procesos
struct list_head *lstProcess;
// Estructura que almacena info de los procesos hijos
struct task_struct *child;
unsigned long rss;

const long minute = 60;
const long hours = minute * 60;
const long day = hours * 24;
const long megabyte = 1024 * 1024;

//estadisticas del sistema
struct sysinfo si;

static void init_meminfo(void){
    si_meminfo(&si);
}
 

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Justin Aguirre - 202004734");
MODULE_DESCRIPTION("Modulo de RAM SO1 Proyecto 1"); 


static int escribir_archivo(struct seq_file *archivo, void *v) {
    init_meminfo();
    long memoriaTotal = si.totalram*(unsigned long)si.mem_unit/(1024*1024);
    long memoriaLibre = si.freeram*(unsigned long)si.mem_unit/(1024*1024);
    long memoriaCompartida = si.sharedram*(unsigned long)si.mem_unit/(1024*1024);
    long memoriaBuffer = si.bufferram*(unsigned long)si.mem_unit/(1024*1024);
    long memoriaUsada = memoriaTotal - (memoriaLibre + memoriaCompartida);

    seq_printf(archivo, "{\n");
    seq_printf(archivo, "\"Total\": %lu,\n",memoriaTotal);
    seq_printf(archivo, "\"Libre\": %lu,\n",memoriaLibre);
    seq_printf(archivo, "\"Compartida\": %lu,\n",memoriaCompartida);    
    seq_printf(archivo, "\"Buffer\": %lu,\n",memoriaBuffer);
    seq_printf(archivo, "}\n");
    //seq_printf(m, "}\n");
    return 0;
}

//Funcion que se ejecutara cada vez que se lea el archivo con el comando CAT
static int al_abrir(struct inode *inode, struct file *file)
{
    return single_open(file, escribir_archivo, NULL);
}

//Si el kernel es 5.6 o mayor se usa la estructura proc_ops
static struct proc_ops operaciones =
{
    .proc_open = al_abrir,
    .proc_read = seq_read
};

//Funcion a ejecuta al insertar el modulo en el kernel con insmod
static int ram_init(void)
{
    proc_create("ram_20200734", 0, NULL, &operaciones);
    printk(KERN_INFO "Modulo iniciado: ram_202004734\n");
    return 0;
}

//Funcion a ejecuta al remover el modulo del kernel con rmmod
static void ram_remove(void)
{
    remove_proc_entry("ram_202004734", NULL);
    printk(KERN_INFO "Modulo removido: ram_202004734\n");
}

module_init(ram_init);
module_exit(ram_remove);