from django.test import TestCase
from django.urls import reverse
from .models import Todo

class TodoModelTest(TestCase):
    def setUp(self):
        self.todo = Todo.objects.create(title="Test Todo", description="Test Description")

    def test_todo_creation(self):
        self.assertTrue(isinstance(self.todo, Todo))
        self.assertEqual(self.todo.__str__(), self.todo.title)
        self.assertEqual(self.todo.title, "Test Todo")
        self.assertEqual(self.todo.description, "Test Description")
        self.assertFalse(self.todo.completed)

class TodoViewTest(TestCase):
    def setUp(self):
        self.todo = Todo.objects.create(title="Existing Todo", description="Existing Description")

    def test_todo_list_view(self):
        response = self.client.get(reverse('todo-list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Existing Todo")
        self.assertTemplateUsed(response, 'todos/todo_list.html')

    def test_todo_create_view(self):
        response = self.client.post(reverse('todo-create'), {
            'title': 'New Todo',
            'description': 'New Description'
        })
        self.assertEqual(response.status_code, 302)  # Redirects after success
        self.assertEqual(Todo.objects.count(), 2)
        self.assertEqual(Todo.objects.last().title, 'New Todo')

    def test_todo_update_view(self):
        response = self.client.post(reverse('todo-update', args=[self.todo.pk]), {
            'title': 'Updated Todo',
            'description': 'Updated Description',
            'completed': True
        })
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'Updated Todo')
        self.assertTrue(self.todo.completed)

    def test_todo_delete_view(self):
        response = self.client.post(reverse('todo-delete', args=[self.todo.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Todo.objects.count(), 0)
