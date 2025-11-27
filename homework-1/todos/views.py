from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import Todo

class TodoListView(ListView):
    model = Todo
    template_name = 'todos/todo_list.html'
    context_object_name = 'todos'
    ordering = ['-created_at']

class TodoCreateView(CreateView):
    model = Todo
    fields = ['title', 'description']
    success_url = reverse_lazy('todo-list')
    template_name = 'todos/todo_form.html'

class TodoUpdateView(UpdateView):
    model = Todo
    fields = ['title', 'description', 'completed']
    success_url = reverse_lazy('todo-list')
    template_name = 'todos/todo_form.html'

class TodoDeleteView(DeleteView):
    model = Todo
    success_url = reverse_lazy('todo-list')
    template_name = 'todos/todo_confirm_delete.html'
