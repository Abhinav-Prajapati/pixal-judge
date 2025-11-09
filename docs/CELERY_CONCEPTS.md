# Celery Concepts Guide

A comprehensive guide to understanding Celery for asynchronous task processing.

---

## 📚 Table of Contents

1. [What is Celery?](#what-is-celery)
2. [Basic Concepts](#basic-concepts)
3. [Message Brokers](#message-brokers)
4. [Workers and Tasks](#workers-and-tasks)
5. [Execution Pools](#execution-pools)
6. [Concurrency](#concurrency)
7. [Advanced Configurations](#advanced-configurations)
8. [Real-World Example: Image Processing](#real-world-example-image-processing)

---

## What is Celery?

**Celery** is a distributed task queue system for Python that allows you to run time-consuming tasks asynchronously in the background.

### Why Use Celery?

- ✅ **Asynchronous Processing**: Don't make users wait for slow operations
- ✅ **Scalability**: Distribute work across multiple machines
- ✅ **Reliability**: Retry failed tasks automatically
- ✅ **Scheduling**: Run periodic tasks (cron-like)
- ✅ **Monitoring**: Track task progress and results

### Simple Analogy

Think of a restaurant:
- **Web Server (FastAPI)**: Waiter taking orders
- **Message Broker (RabbitMQ)**: Kitchen order board
- **Celery Workers**: Chefs cooking the food
- **Tasks**: Individual dishes to prepare

The waiter doesn't cook; they take the order, put it on the board, and continue serving. Chefs (workers) pick up orders and cook them.

---

## Basic Concepts

### 1. Task

A **task** is a function that runs asynchronously.

```python
from celery import Celery

app = Celery('myapp', broker='amqp://localhost')

@app.task
def add(x, y):
    return x + y
```

### 2. Message Broker

The **broker** is the middleman that stores task messages until workers process them.

**Common Brokers:**
- **RabbitMQ** ⭐ (Most features, production-ready)
- **Redis** (Fast, simple, good for small-medium projects)
- **Amazon SQS** (Cloud-native)

```python
# RabbitMQ
broker = 'amqp://user:password@localhost:5672/'

# Redis
broker = 'redis://localhost:6379/0'
```

### 3. Worker

A **worker** is a process that executes tasks.

```bash
# Start a worker
celery -A tasks worker --loglevel=info
```

### 4. Task Queue

Tasks are sent to **queues**. Workers consume from queues.

```
[FastAPI] → [Queue: default] → [Worker 1]
         → [Queue: emails]  → [Worker 2]
         → [Queue: reports] → [Worker 3]
```

---

## Message Brokers

### RabbitMQ vs Redis

| Feature | RabbitMQ | Redis |
|---------|----------|-------|
| Reliability | High (AMQP protocol) | Medium (in-memory) |
| Persistence | Yes (disk) | Optional |
| Task Priority | Yes | Limited |
| Monitoring UI | Yes (Management Plugin) | No |
| Setup Complexity | Medium | Easy |
| Best for | Production, complex workflows | Development, simple queues |

### Setting Up RabbitMQ

```yaml
# docker-compose.yml
services:
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      - RABBITMQ_DEFAULT_USER=user
      - RABBITMQ_DEFAULT_PASS=password
    ports:
      - "5672:5672"    # AMQP port
      - "15672:15672"  # Management UI
```

Access Management UI: http://localhost:15672

---

## Workers and Tasks

### Task Definition

```python
from celery import Celery

app = Celery('tasks', broker='amqp://localhost')

@app.task(bind=True, max_retries=3)
def process_image(self, image_id):
    try:
        # Process image
        result = heavy_computation(image_id)
        return result
    except Exception as e:
        # Retry after 60 seconds
        raise self.retry(exc=e, countdown=60)
```

### Task Options

```python
@app.task(
    bind=True,              # Pass task instance as 'self'
    max_retries=3,         # Retry 3 times on failure
    default_retry_delay=60, # Wait 60s between retries
    time_limit=300,        # Kill task after 5 minutes
    soft_time_limit=240,   # Warn after 4 minutes
    queue='high-priority', # Send to specific queue
    rate_limit='10/m',     # Max 10 tasks per minute
)
def my_task(self, data):
    pass
```

### Calling Tasks

```python
# Synchronous (blocking)
result = add(4, 6)  # Returns 10 immediately

# Asynchronous (non-blocking)
task = add.delay(4, 6)  # Returns AsyncResult immediately
result = task.get()     # Wait for result (blocking)

# Asynchronous with more control
task = add.apply_async(
    args=[4, 6],
    countdown=60,        # Run after 60 seconds
    expires=120,         # Expire if not run in 2 minutes
    retry=True,
    retry_policy={
        'max_retries': 3,
        'interval_start': 0,
        'interval_step': 0.2,
        'interval_max': 0.2,
    }
)
```

---

## Execution Pools

A **pool** defines how workers execute tasks. Think of it as the worker's execution strategy.

### 1. `prefork` (Default) - Multiprocessing

```bash
celery -A tasks worker --pool=prefork --concurrency=4
```

**How it works:**
- Creates multiple child **processes** (forks)
- Each process has **isolated memory**
- True parallel execution (uses multiple CPU cores)

**Visual:**
```
Main Worker Process
├── Child Process 1 [4GB RAM, Task A running]
├── Child Process 2 [4GB RAM, Task B running]
├── Child Process 3 [4GB RAM, Task C running]
└── Child Process 4 [4GB RAM, Task D running]
Total: 16GB RAM
```

**Pros:**
- ✅ True parallelism (no GIL limitations)
- ✅ Process isolation (one crash doesn't affect others)
- ✅ Best for CPU-intensive tasks

**Cons:**
- ❌ High memory usage (each process duplicates memory)
- ❌ Slow process creation
- ❌ Can't share resources (like ML models) between processes

**Use when:**
- CPU-intensive tasks
- You have plenty of RAM
- Tasks don't share large objects (like models)

---

### 2. `solo` - Single Process

```bash
celery -A tasks worker --pool=solo
```

**How it works:**
- Single process, single thread
- Tasks run **sequentially** (one after another)
- All tasks share the same memory

**Visual:**
```
Single Worker Process [2GB RAM]
├── Task A [running now]
├── Task B [waiting in queue]
├── Task C [waiting in queue]
└── Task D [waiting in queue]
```

**Pros:**
- ✅ Minimal memory usage
- ✅ Can share resources (perfect for ML models!)
- ✅ Simple and predictable
- ✅ No overhead from process creation

**Cons:**
- ❌ No parallelism (sequential only)
- ❌ One task blocks others

**Use when:**
- GPU-bound tasks (GPU is the bottleneck, not CPU)
- Large ML models that can't fit in memory multiple times
- Tasks need to share loaded models/data
- **This is perfect for image embedding generation!**

---

### 3. `threads` - Multithreading

```bash
celery -A tasks worker --pool=threads --concurrency=8
```

**How it works:**
- Multiple **threads** in one process
- Threads share memory
- Limited by Python's GIL (Global Interpreter Lock)

**Visual:**
```
Single Process [4GB RAM shared]
├── Thread 1 [Task A - waiting for I/O]
├── Thread 2 [Task B - running Python code] ← GIL here
├── Thread 3 [Task C - waiting for I/O]
└── Thread 4 [Task D - waiting for network]
```

**Pros:**
- ✅ Shared memory (can share models!)
- ✅ Low memory overhead
- ✅ Good for I/O-bound tasks

**Cons:**
- ❌ GIL prevents true parallelism for CPU-bound tasks
- ❌ Thread safety concerns
- ❌ Not great for pure Python computation

**Use when:**
- I/O-bound tasks (reading files, network requests)
- Tasks spend time waiting (database queries)
- Need to share memory but want some concurrency

---

### 4. `gevent` / `eventlet` - Coroutines

```bash
celery -A tasks worker --pool=gevent --concurrency=1000
```

**How it works:**
- Cooperative multitasking using **greenlets** (lightweight coroutines)
- Single thread, but can handle thousands of tasks
- Tasks must explicitly yield control

**Visual:**
```
Single Thread [Switching between tasks]
├── Task A [waiting for API response] → yield
├── Task B [waiting for database]    → yield
├── Task C [processing data]          → running
└── ... 997 more tasks
```

**Pros:**
- ✅ Can handle thousands of concurrent tasks
- ✅ Very low memory per task
- ✅ Perfect for I/O-bound workloads

**Cons:**
- ❌ Requires gevent-compatible libraries
- ❌ Not suitable for CPU-intensive work
- ❌ More complex debugging

**Use when:**
- Web scraping (thousands of URLs)
- API calls to external services
- Lightweight I/O operations
- Need massive concurrency

---

## Concurrency

**Concurrency** is the number of task executors (processes/threads/greenlets).

### Concurrency with Different Pools

#### prefork + concurrency=4
```bash
celery -A tasks worker --pool=prefork --concurrency=4
```
- Creates **4 processes**
- 4 tasks run in parallel on 4 CPU cores
- Each process has separate memory

#### solo + concurrency (ignored)
```bash
celery -A tasks worker --pool=solo --concurrency=10  # 10 is ignored!
```
- Always runs with concurrency=1
- Tasks execute sequentially
- Setting concurrency higher has no effect

#### threads + concurrency=8
```bash
celery -A tasks worker --pool=threads --concurrency=8
```
- Creates **8 threads** in one process
- Threads share memory
- Good for I/O, limited for CPU due to GIL

#### gevent + concurrency=1000
```bash
celery -A tasks worker --pool=gevent --concurrency=1000
```
- Creates **1000 greenlets**
- Can handle 1000 concurrent I/O operations
- Still single-threaded

### Auto-Concurrency

```bash
# Default: Uses number of CPU cores
celery -A tasks worker  # 8 CPUs = 8 workers
```

On an 8-core machine:
- `--pool=prefork` → 8 processes
- `--pool=threads` → 8 threads
- `--pool=solo` → 1 process (ignores CPU count)

---

## Advanced Configurations

### Worker Configuration

```python
# config.py
CELERY_TASK_CONFIG = {
    "task_serializer": "json",           # Serialize tasks as JSON
    "accept_content": ["json"],          # Only accept JSON
    "result_serializer": "json",         # Results as JSON
    "timezone": "UTC",                   # Use UTC timezone
    "enable_utc": True,                  # Enable UTC
    
    # Memory Management
    "worker_prefetch_multiplier": 1,     # Take 1 task at a time
    "worker_max_tasks_per_child": 50,    # Restart worker after 50 tasks
    "worker_max_memory_per_child": 200000, # Restart if > 200MB
    
    # Performance
    "task_acks_late": True,              # Acknowledge after completion
    "task_reject_on_worker_lost": True,  # Requeue if worker dies
    
    # Results
    "result_backend": "redis://localhost:6379/0",
    "result_expires": 3600,              # Results expire after 1 hour
}
```

### Task Priority

```python
# Define priority queue
app.conf.task_routes = {
    'tasks.high_priority_task': {'queue': 'high'},
    'tasks.normal_task': {'queue': 'default'},
    'tasks.low_priority_task': {'queue': 'low'},
}

# Run workers for different priorities
# Terminal 1
celery -A tasks worker -Q high --concurrency=4

# Terminal 2  
celery -A tasks worker -Q default --concurrency=2

# Terminal 3
celery -A tasks worker -Q low --concurrency=1
```

### Routing Tasks

```python
# tasks.py
@app.task(queue='fast')
def quick_task():
    pass

@app.task(queue='slow')
def slow_task():
    pass

# Call with specific queue
quick_task.apply_async(queue='fast')
slow_task.apply_async(queue='slow')
```

### Task Chaining

```python
from celery import chain, group, chord

# Sequential execution (chain)
result = chain(
    add.s(2, 2),      # 4
    add.s(4),         # 8
    add.s(8)          # 16
)()

# Parallel execution (group)
job = group(
    add.s(2, 2),
    add.s(4, 4),
    add.s(8, 8)
)()
results = job.get()  # [4, 8, 16]

# Parallel then aggregate (chord)
callback = add.s()
header = group(add.s(i, i) for i in range(10))
result = chord(header)(callback)
# Runs 10 additions in parallel, then sums results
```

### Periodic Tasks (Celery Beat)

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    # Run every 30 minutes
    'cleanup-every-30-mins': {
        'task': 'tasks.cleanup_old_files',
        'schedule': 30 * 60,  # seconds
    },
    
    # Run daily at midnight
    'backup-daily': {
        'task': 'tasks.backup_database',
        'schedule': crontab(hour=0, minute=0),
    },
    
    # Run every Monday at 7:30 AM
    'weekly-report': {
        'task': 'tasks.generate_weekly_report',
        'schedule': crontab(hour=7, minute=30, day_of_week=1),
    },
}

# Start beat scheduler
celery -A tasks beat --loglevel=info
```

---

## Real-World Example: Image Processing

### The Problem

You have an image upload system that needs to:
1. Generate thumbnails (fast, CPU-bound, ~0.5s each)
2. Generate embeddings with CLIP model (slow, GPU-bound, ~2s each, 2GB model)

**Bad Solution: Sequential Processing**
```python
# In API endpoint (BAD - blocks the request!)
def upload_image(file):
    image = save_image(file)
    generate_thumbnail(image.id)     # User waits 0.5s
    generate_embedding(image.id)     # User waits 2s
    return image  # 2.5s total response time!
```

**Good Solution: Celery with Optimized Workers**

### Architecture

```
┌─────────────┐
│  FastAPI    │ ← User uploads image
│   Server    │
└──────┬──────┘
       │
       │ .delay() - returns immediately
       │
       ▼
┌─────────────┐
│  RabbitMQ   │
│   Broker    │
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Worker    │   │   Worker    │   │   Worker    │
│   Queue:    │   │   Queue:    │   │   Queue:    │
│ thumbnails  │   │ thumbnails  │   │ embeddings  │
│             │   │             │   │             │
│ 4 processes │   │ 4 processes │   │ 1 process   │
│ No ML model │   │ No ML model │   │ CLIP loaded │
└─────────────┘   └─────────────┘   └─────────────┘
  Parallel            Parallel         Sequential
  ~0.5s/task          ~0.5s/task       ~2s/task
```

### Implementation

#### 1. Task Definition with Queues

```python
# tasks.py
import logging
import torch
from celery import Celery
from sqlalchemy.orm import Session

from database import get_db
from src.images import crud
from utils.file_handling import create_thumbnail
from src.processing.features import CLIP
from config import CELERY_BROKER_URL, CELERY_TASK_CONFIG

logger = logging.getLogger(__name__)

celery_app = Celery('tasks', broker=CELERY_BROKER_URL)
celery_app.conf.update(**CELERY_TASK_CONFIG)

# Global model cache for embeddings worker
_clip_model_cache = None

def get_clip_model():
    """Load CLIP model once per worker process."""
    global _clip_model_cache
    if _clip_model_cache is None:
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"Loading CLIP model on device: {device}")
        _clip_model_cache = CLIP(device=device)
        logger.info("CLIP model loaded and cached")
    return _clip_model_cache


# Fast task - can run in parallel
@celery_app.task(bind=True, max_retries=3, queue='thumbnails')
def generate_thumbnail_task(self, image_id: int):
    logger.info(f"Thumbnail task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found")
            return

        if not image.has_thumbnail:
            create_thumbnail(image)
            db.commit()
            logger.info(f"Thumbnail created for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error creating thumbnail for image_id {image_id}: {e}")
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()


# Slow task - sequential with shared model
@celery_app.task(bind=True, max_retries=3, queue='embeddings')
def generate_embedding_task(self, image_id: int):
    logger.info(f"Embedding task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found")
            return

        if image.features is None:
            extractor = get_clip_model()  # Reuse cached model
            features = extractor.get_embedding(image.file_path)
            if features is not None:
                image.features = features
                db.commit()
                logger.info(f"Embedding generated for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error generating embedding for image_id {image_id}: {e}")
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
```

#### 2. API Endpoint

```python
# router.py
from fastapi import APIRouter, UploadFile, File
from typing import List

router = APIRouter(prefix="/images", tags=["Images"])

@router.post("/upload")
def upload_images(files: List[UploadFile] = File(...)):
    results = []
    
    for file in files:
        # Save image to database
        image = save_image_to_db(file)
        results.append(image)
        
        # Queue background tasks (returns immediately!)
        generate_thumbnail_task.delay(image.id)
        generate_embedding_task.delay(image.id)
    
    return results  # Returns in ~50ms, tasks run in background
```

#### 3. Worker Startup

```bash
# Terminal 1: Thumbnail workers (parallel processing)
celery -A tasks worker \
  -Q thumbnails \
  --concurrency=4 \
  --loglevel=info \
  --pool=prefork

# Terminal 2: Embedding worker (sequential, GPU)
celery -A tasks worker \
  -Q embeddings \
  --concurrency=1 \
  --loglevel=info \
  --pool=solo

# Or combined (simpler for development)
celery -A tasks worker \
  -Q thumbnails,embeddings \
  --concurrency=1 \
  --pool=solo \
  --loglevel=info
```

### Performance Comparison

#### Before Celery (Synchronous)
```
User uploads 10 images
├── Save image 1 (50ms)
├── Thumbnail 1 (500ms)
├── Embedding 1 (2000ms)
├── Save image 2 (50ms)
├── Thumbnail 2 (500ms)
├── Embedding 2 (2000ms)
└── ... (repeat 8 more times)

Total time: 10 × (50 + 500 + 2000) = 25,550ms (25.5 seconds!)
User experience: Horrible 😢
```

#### After Celery (Asynchronous)
```
User uploads 10 images
├── Save image 1 (50ms)  → Queue tasks
├── Save image 2 (50ms)  → Queue tasks
├── Save image 3 (50ms)  → Queue tasks
└── ... (10 images)

Response time: 10 × 50ms = 500ms (0.5 seconds)
User experience: Instant! 🚀

Background processing:
├── Thumbnails: 10 tasks ÷ 4 workers = ~1.25s
└── Embeddings: 10 tasks × 2s = 20s (but user doesn't wait!)
```

### Memory Usage Comparison

#### Without Queue Separation (prefork, concurrency=4)
```
Worker 1: Thumbnail task [2GB CLIP model loaded]
Worker 2: Thumbnail task [2GB CLIP model loaded]
Worker 3: Embedding task [2GB CLIP model loaded]
Worker 4: Embedding task [2GB CLIP model loaded]

Total RAM: 8GB (wasteful!)
```

#### With Queue Separation
```
Thumbnail Workers (4 processes): No model loaded = 4×100MB = 400MB
Embedding Worker (1 process): CLIP model = 2GB

Total RAM: 2.4GB (3.3x more efficient!)
```

---

## Common Patterns and Best Practices

### 1. Model Caching (Singleton Pattern)

```python
# Global cache at module level
_model_cache = None

def get_model():
    global _model_cache
    if _model_cache is None:
        _model_cache = load_expensive_model()
    return _model_cache

@celery_app.task
def process_with_model(data):
    model = get_model()  # Reuses cached model
    return model.predict(data)
```

### 2. Task Retries with Exponential Backoff

```python
@celery_app.task(
    bind=True,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,      # Exponential backoff
    retry_backoff_max=600,   # Max 10 minutes
    retry_jitter=True,       # Add randomness
    max_retries=5
)
def fetch_external_api(self, url):
    response = requests.get(url)
    return response.json()
```

### 3. Task Result Handling

```python
# Option 1: Polling
task = long_running_task.delay()
while not task.ready():
    time.sleep(1)
result = task.get()

# Option 2: Callback
@celery_app.task
def on_completion(result):
    send_email(f"Task completed: {result}")

long_running_task.apply_async(link=on_completion.s())

# Option 3: Webhook
@celery_app.task
def notify_webhook(result):
    requests.post('https://myapp.com/webhook', json=result)
```

### 4. Resource Cleanup

```python
@celery_app.task(bind=True)
def process_file(self, file_path):
    try:
        with open(file_path) as f:
            data = f.read()
        result = expensive_operation(data)
        return result
    finally:
        # Always cleanup, even on failure
        if os.path.exists(file_path):
            os.remove(file_path)
```

### 5. Task Monitoring

```python
from celery.signals import task_prerun, task_postrun, task_failure

@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    logger.info(f"Task {task.name}[{task_id}] started")

@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    logger.info(f"Task {task.name}[{task_id}] completed")

@task_failure.connect
def task_failure_handler(task_id, exception, *args, **kwargs):
    logger.error(f"Task {task_id} failed: {exception}")
```

---

## Troubleshooting

### Problem: Workers Keep Dying

**Symptom**: Workers crash or restart frequently

**Causes:**
1. Out of memory (OOM)
2. Unhandled exceptions
3. Task timeout

**Solutions:**
```python
# config.py
CELERY_TASK_CONFIG = {
    "worker_max_memory_per_child": 200000,  # Restart before OOM
    "task_time_limit": 300,                  # Hard limit: 5 minutes
    "task_soft_time_limit": 240,             # Soft warning: 4 minutes
}

# tasks.py
@celery_app.task(bind=True)
def my_task(self):
    try:
        result = do_work()
        return result
    except Exception as e:
        logger.error(f"Task failed: {e}", exc_info=True)
        raise  # Re-raise for retry
```

### Problem: Tasks Not Processing

**Check:**
```bash
# 1. Is RabbitMQ running?
docker ps | grep rabbitmq

# 2. Are workers running?
celery -A tasks inspect active

# 3. Check queue length
celery -A tasks inspect stats

# 4. Purge stuck tasks
celery -A tasks purge

# 5. Check worker logs
celery -A tasks worker --loglevel=debug
```

### Problem: Model Loading Every Time

**Symptom**: Logs show "Loading CLIP model" repeatedly

**Cause**: Using `prefork` pool with multiple workers

**Solution**: Use `solo` pool
```bash
celery -A tasks worker --pool=solo -Q embeddings
```

### Problem: Slow Task Processing

**Diagnose:**
```python
import time

@celery_app.task
def slow_task():
    start = time.time()
    
    # Measure each step
    t1 = time.time()
    load_data()
    logger.info(f"Load data: {time.time() - t1}s")
    
    t2 = time.time()
    process_data()
    logger.info(f"Process data: {time.time() - t2}s")
    
    logger.info(f"Total time: {time.time() - start}s")
```

---

## Summary Cheat Sheet

### Pool Selection

| Use Case | Pool | Concurrency |
|----------|------|-------------|
| CPU-intensive, plenty of RAM | `prefork` | Number of CPUs |
| GPU tasks, large models | `solo` | 1 |
| I/O-bound, moderate load | `threads` | 10-50 |
| Massive I/O concurrency | `gevent` | 1000+ |
| ML inference with GPU | `solo` | 1 |
| Image thumbnails (CPU) | `prefork` | 4-8 |
| API calls | `gevent` | 100-1000 |

### Common Commands

```bash
# Start basic worker
celery -A tasks worker --loglevel=info

# Start with specific pool and concurrency
celery -A tasks worker --pool=solo --loglevel=info

# Start with specific queue
celery -A tasks worker -Q high,medium,low

# Multiple workers for different queues
celery -A tasks worker -Q fast --concurrency=4 &
celery -A tasks worker -Q slow --pool=solo &

# Inspect active tasks
celery -A tasks inspect active

# Check worker stats
celery -A tasks inspect stats

# Purge all tasks
celery -A tasks purge

# Start beat scheduler (for periodic tasks)
celery -A tasks beat

# Combined worker + beat
celery -A tasks worker --beat --loglevel=info
```

### Configuration Template

```python
# config.py
CELERY_TASK_CONFIG = {
    # Serialization
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    
    # Timezone
    "timezone": "UTC",
    "enable_utc": True,
    
    # Worker behavior
    "worker_prefetch_multiplier": 1,      # Fetch 1 task at a time
    "worker_max_tasks_per_child": 50,     # Restart after 50 tasks
    "worker_max_memory_per_child": 200000, # Restart if > 200MB
    
    # Task execution
    "task_acks_late": True,               # Acknowledge after completion
    "task_reject_on_worker_lost": True,   # Requeue if worker dies
    "task_time_limit": 300,               # Hard limit: 5 minutes
    "task_soft_time_limit": 240,          # Soft limit: 4 minutes
    
    # Results
    "result_backend": "redis://localhost:6379/0",
    "result_expires": 3600,               # Results expire after 1 hour
}
```

---

## Further Reading

- [Celery Official Documentation](https://docs.celeryq.dev/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [Celery Best Practices](https://docs.celeryq.dev/en/stable/userguide/tasks.html#best-practices)
- [Flower - Celery Monitoring](https://flower.readthedocs.io/)

---

**Last Updated**: November 10, 2025
