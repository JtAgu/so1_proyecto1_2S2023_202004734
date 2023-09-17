#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/proc_fs.h>
#include <asm/uaccess.h>
#include <linux/seq_file.h>
#include <linux/hugetlb.h>
#include <linux/sched.h>
#include <linux/sched/signal.h>
#include <linux/fs.h>
#include <linux/sysinfo.h>
#include <linux/slab.h>
#include <linux/mm.h>
#include <linux/swap.h>
#include <linux/timekeeping.h>
#include <linux/cred.h>


struct sysinfo inf;


MODULE_LICENSE("GPL");
MODULE_AUTHOR("Henry Mendoza - 202004734");
MODULE_DESCRIPTION("Modulo de CPU SO1 Proyecto 1"); 



static int escribir_archivo(struct seq_file *m, void *v){
    struct task_struct *tareas;
	struct task_struct *hijos;
	struct list_head *head;

    seq_printf(m, "{\n\"procesos\" : [\n");

	for_each_process(tareas){
        seq_printf(m, "{\n");
        seq_printf(m, "\"Pid\" :%ld,\n", tareas->pid);
        seq_printf(m, "\"Nombre\": \"%s\",\n", tareas->comm);
        seq_printf(m, "\"Usuario\": %d,\n", tareas->cred->uid);
        seq_printf(m, "\"Estado\": %ld,\n",tareas->__state);
        if (tareas->mm) {
            unsigned long rss = get_mm_rss(tareas->active_mm) << PAGE_SHIFT;
            seq_printf(m, "\"Memoria\": %ld,\n", rss);
        } 
        else {
            seq_printf(m, "\"Memoria\": %ld,\n", (long) 0);
        }

        seq_printf(m, "\"Hijos\": [\n");
        list_for_each(head, &tareas->children)
        {
            hijos = list_entry(head, struct task_struct, sibling);
            seq_printf(m, "{\n");
            seq_printf(m, "\"Pid\" :%ld,\n", hijos->pid);
            seq_printf(m, "\"Nombre\": \"%s\"\n", hijos->comm);
            seq_printf(m, "},\n");
            
        }
        seq_printf(m, "{");
        seq_printf(m, "}\n");
        seq_printf(m, "]\n");
        seq_printf(m, "},\n");
	}

    seq_printf(m, "{");
    seq_printf(m, "}\n");
    seq_printf(m, "],");
    seq_printf(m, "}");
	return 0;
}


static int al_abrir(struct inode *inode, struct file *file)
{
    return single_open(file, escribir_archivo, NULL);
}


static struct proc_ops ops_cpu={
    .proc_open = al_abrir,
    .proc_read = seq_read
};


static int __init cpu_init(void)
{
    struct proc_dir_entry *entry;
    entry = proc_create("cpu_202004810", 0777, NULL, &ops_cpu);
    if (!entry){
		return -1;
	}else{
		printk(KERN_INFO "Modulo iniciado: cpu_202004734\n");
	}
	return 0;
}


static void __exit cpu_exit(void)
{
    remove_proc_entry("cpu_202004810", NULL);
    printk(KERN_INFO "Modulo removido: cpu_202004734\n");
}


module_init(cpu_init);
module_exit(cpu_exit);
