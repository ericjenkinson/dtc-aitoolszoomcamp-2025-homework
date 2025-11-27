# Django Todo App

A simple, robust Todo List application built with Django. This project demonstrates a full CRUD (Create, Read, Update, Delete) application with a clean, responsive user interface.

## Features

-   **Manage Todos**: Create new tasks, view your list, update details, and delete tasks.
-   **Status Tracking**: Mark tasks as completed or pending.
-   **Responsive Design**: Clean UI that works on desktop and mobile.
-   **Admin Interface**: Full management capability via the Django Admin panel.
-   **Test Coverage**: Includes unit tests for models and views.

## Prerequisites

-   Python 3.10+
-   Conda (recommended for environment management)

## Setup and Installation

### 1. Environment Setup

This project uses a Conda environment. You can use an existing one or create a new one.

**Option A: Create a new environment**
```bash
conda create -n my-django-env python=3.12
conda activate my-django-env
```

**Option B: Use existing 'aitools' environment (as used in development)**
```bash
conda activate aitools
```

### 2. Install Dependencies

Ensure Django is installed in your active environment:

```bash
conda install django
# OR
pip install django
```

### 3. Database Setup

Initialize the SQLite database by applying migrations:

```bash
python manage.py migrate
```

### 4. Create Superuser (Optional)

To access the Django Admin interface (`/admin`), create a superuser:

```bash
python manage.py createsuperuser
```

## Running the Application

1.  Start the development server:
    ```bash
    python manage.py runserver
    ```

2.  Open your web browser and navigate to:
    [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Running Tests

This project includes unit tests to ensure functionality. To run them:

```bash
python manage.py test
```

## Project Structure

-   `todo_project/`: Main project configuration settings.
-   `todos/`: The Todo application containing models, views, and templates.
    -   `models.py`: Defines the `Todo` data structure.
    -   `views.py`: Handles the logic for CRUD operations.
    -   `templates/todos/`: HTML templates for the UI.
    -   `tests.py`: Unit tests.
-   `db.sqlite3`: Local development database.
-   `manage.py`: Django's command-line utility.
