import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTask, deleteTask } from "@/features/tasks/actions";
import { getTasks } from "@/features/tasks/queries";

export async function TaskList() {
  const [t, tasks] = await Promise.all([getTranslations("tasks"), getTasks()]);

  return (
    <section className="space-y-5 border-t pt-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <form action={createTask} className="flex flex-wrap gap-3">
        <Label className="sr-only" htmlFor="task-title">{t("newTask")}</Label>
        <Input
          className="flex-1"
          id="task-title"
          maxLength={160}
          name="title"
          placeholder={t("placeholder")}
          required
        />
        <Button type="submit" size={'lg'}>{t("add")}</Button>
      </form>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {tasks.map((task) => (
            <li className="flex items-center justify-between gap-4 py-3" key={task.id}>
              <span>{task.title}</span>
              <form action={deleteTask.bind(null, task.id)}>
                <Button size="sm" variant="ghost" type="submit">
                  {t("remove")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
