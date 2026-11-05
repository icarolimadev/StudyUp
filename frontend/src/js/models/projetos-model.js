export function projectProgress(project) {
  const steps = project.steps || [];
  const completed = steps.filter(step => step.done).length;
  const total = steps.length;
  return {
    completed, total,
    percent: total ? Math.round(completed / total * 100) : 0,
    done: total > 0 && completed === total,
  };
}

export function filterProjects(activities, filter = 'todos') {
  return activities.filter(item => {
    if (item.type !== 'projeto') return false;
    const { done } = projectProgress(item);
    return filter === 'concluidos' ? done : filter === 'andamento' ? !done : true;
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function setProjectStep(project, stepId, done) {
  const step = project.steps?.find(item => item.id === stepId);
  if (!step || typeof done !== 'boolean') return false;
  step.done = done;
  // As outras telas usam done para identificar pendências e próximas entregas.
  project.done = projectProgress(project).done;
  return true;
}
