-- ============================================================
-- Noodle LMS - MOCK DATA POPULATION SCRIPT
-- ============================================================
-- Run this AFTER your schema is set up
-- This populates the database with realistic test data
-- ============================================================

-- ============================================================
-- STEP 1: Clean up existing test data (optional)
-- ============================================================
-- Uncomment these if you want to start fresh:
-- DELETE FROM quiz_attempts;
-- DELETE FROM quiz_questions;
-- DELETE FROM uploads;
-- DELETE FROM user_courses;
-- DELETE FROM course_pages;
-- DELETE FROM questions;
-- DELETE FROM course_instructors;
-- DELETE FROM users WHERE email LIKE '%@test.noodle.com';

-- ============================================================
-- STEP 2: Insert sample courses
-- ============================================================

INSERT INTO courses (id, name, subtitle, description, cover_image, is_archived) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Introduction to Web Development',
  'Spring 2026',
  'Learn the fundamentals of web development including HTML, CSS, JavaScript, and modern frameworks like React and Vue. This comprehensive course covers everything from basic markup to advanced state management.',
  '/placeholder.svg',
  false
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Data Structures and Algorithms',
  'Fall 2025',
  'Master essential data structures and algorithms that form the backbone of computer science. Topics include arrays, linked lists, trees, graphs, sorting algorithms, and dynamic programming.',
  '/placeholder.svg',
  false
),
(
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Machine Learning Fundamentals',
  'Spring 2026',
  'An introduction to machine learning concepts and techniques using Python. Learn about supervised learning, unsupervised learning, neural networks, and how to apply ML to real-world problems.',
  '/placeholder.svg',
  false
),
(
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'Database Systems',
  'Fall 2025',
  'Deep dive into relational database design, SQL, normalization, indexing, and query optimization. Also covers NoSQL databases and modern data storage solutions.',
  '/placeholder.svg',
  false
),
(
  'e5f6a7b8-c9d0-1234-ef01-345678901234',
  'Computer Networks',
  'Spring 2025',
  'Understand how computer networks work from the physical layer to application protocols. Covers TCP/IP, routing, DNS, HTTP, and network security fundamentals.',
  '/placeholder.svg',
  true
),
(
  'f6a7b8c9-d0e1-2345-f012-456789012345',
  'Software Engineering',
  'Fall 2026',
  'Learn industry best practices for software development including agile methodologies, version control, testing, CI/CD, and collaborative development workflows.',
  '/placeholder.svg',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description;

-- ============================================================
-- STEP 3: Create mock users
-- ============================================================

-- Create test users (students)
INSERT INTO users (id, name, email, bits_id, phone, role) VALUES
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Alice Johnson',
  'alice.johnson@test.noodle.com',
  '2021A7PS1234G',
  '9876543210',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  'Bob Smith',
  'bob.smith@test.noodle.com',
  '2021A7PS2345G',
  '9876543211',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d481',
  'Carol Davis',
  'carol.davis@test.noodle.com',
  '2022A7PS3456G',
  '9876543212',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d482',
  'David Wilson',
  'david.wilson@test.noodle.com',
  '2022A7PS4567G',
  '9876543213',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d483',
  'Emma Brown',
  'emma.brown@test.noodle.com',
  '2023A7PS5678G',
  '9876543214',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d484',
  'Frank Miller',
  'frank.miller@test.noodle.com',
  '2023A7PS6789G',
  '9876543215',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d485',
  'Grace Lee',
  'grace.lee@test.noodle.com',
  '2021A7PS7890G',
  '9876543216',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d486',
  'Henry Taylor',
  'henry.taylor@test.noodle.com',
  '2022A7PS8901G',
  '9876543217',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d487',
  'Ivy Chen',
  'ivy.chen@test.noodle.com',
  '2023A7PS9012G',
  '9876543218',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d488',
  'Jack Wang',
  'jack.wang@test.noodle.com',
  '2021A7PS0123G',
  '9876543219',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d489',
  'Karen White',
  'karen.white@test.noodle.com',
  '2022A7PS1235G',
  '9876543220',
  'student'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d490',
  'Leo Martinez',
  'leo.martinez@test.noodle.com',
  '2023A7PS2346G',
  '9876543221',
  'student'
),
-- Create test admin users
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d491',
  'Prof. Sarah Admin',
  'sarah.admin@test.noodle.com',
  NULL,
  '9876543222',
  'admin'
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d492',
  'Prof. Michael Instructor',
  'michael.instructor@test.noodle.com',
  NULL,
  '9876543223',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- ============================================================
-- STEP 4: Register students for courses
-- ============================================================

-- Web Development Course - 8 students
INSERT INTO user_courses (user_id, course_id, registered_at) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '30 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '28 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '25 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '20 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '15 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '5 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '3 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Data Structures Course - 6 students
INSERT INTO user_courses (user_id, course_id, registered_at) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '35 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '30 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '25 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '20 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '10 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d489', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Machine Learning Course - 5 students
INSERT INTO user_courses (user_id, course_id, registered_at) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'c3d4e5f6-a7b8-9012-cdef-123456789012', NOW() - INTERVAL '20 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'c3d4e5f6-a7b8-9012-cdef-123456789012', NOW() - INTERVAL '18 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'c3d4e5f6-a7b8-9012-cdef-123456789012', NOW() - INTERVAL '15 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'c3d4e5f6-a7b8-9012-cdef-123456789012', NOW() - INTERVAL '12 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d488', 'c3d4e5f6-a7b8-9012-cdef-123456789012', NOW() - INTERVAL '8 days')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Database Systems Course - 7 students
INSERT INTO user_courses (user_id, course_id, registered_at) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '40 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '35 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '30 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '25 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '18 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d488', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '10 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d490', 'd4e5f6a7-b8c9-0123-def0-234567890123', NOW() - INTERVAL '4 days')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Archived Course - 3 students
INSERT INTO user_courses (user_id, course_id, registered_at) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'e5f6a7b8-c9d0-1234-ef01-345678901234', NOW() - INTERVAL '90 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'e5f6a7b8-c9d0-1234-ef01-345678901234', NOW() - INTERVAL '88 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'e5f6a7b8-c9d0-1234-ef01-345678901234', NOW() - INTERVAL '85 days')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Software Engineering Course - 4 students
INSERT INTO user_courses (user_id, course_id, registered_at) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'f6a7b8c9-d0e1-2345-f012-456789012345', NOW() - INTERVAL '14 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'f6a7b8c9-d0e1-2345-f012-456789012345', NOW() - INTERVAL '10 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d490', 'f6a7b8c9-d0e1-2345-f012-456789012345', NOW() - INTERVAL '6 days'),
('f47ac10b-58cc-4372-a567-0e02b2c3d491', 'f6a7b8c9-d0e1-2345-f012-456789012345', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ============================================================
-- STEP 5: Add course pages (modules and articles) with proper UUIDs
-- ============================================================

-- Web Development Course Pages
INSERT INTO course_pages (id, name, type, course_id, parent_id, "index", doc) VALUES
(
  '11111111-1111-1111-1111-111111111101',
  'Getting Started with HTML',
  'Module',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NULL,
  0,
  NULL
),
(
  '11111111-1111-1111-1111-111111111102',
  'What is HTML?',
  'Article',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '11111111-1111-1111-1111-111111111101',
  0,
  '# What is HTML?

HTML (HyperText Markup Language) is the standard markup language for creating web pages.

## Key Concepts

- **Elements**: HTML consists of elements like div, p, h1, etc.
- **Tags**: Elements are defined using tags
- **Attributes**: Tags can have attributes like class, id, href

## Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello World!</h1>
    <p>This is my first webpage.</p>
  </body>
</html>
```

## Why Learn HTML?

HTML is the foundation of web development. Every website you visit uses HTML to structure its content. Understanding HTML is essential for:

1. Building websites from scratch
2. Understanding how web pages work
3. Working with content management systems
4. Communicating with developers

## Common HTML Elements

### Headings
HTML provides six levels of headings, from h1 (most important) to h6 (least important).

### Paragraphs
The p element is used for paragraphs of text.

### Links
The a (anchor) element creates hyperlinks to other pages.

### Images
The img element displays images on the page.'
),
(
  '11111111-1111-1111-1111-111111111106',
  'HTML Elements and Tags',
  'Article',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '11111111-1111-1111-1111-111111111101',
  2,
  '# HTML Elements and Tags

## Block vs Inline Elements

### Block Elements
Block elements take up the full width available and start on a new line.

- div - generic container
- p - paragraph
- h1-h6 - headings
- ul, ol - lists
- table - tables

### Inline Elements
Inline elements only take up as much width as necessary.

- span - generic inline container
- a - links
- strong - bold text
- em - italic text
- img - images

## Semantic HTML

Semantic elements clearly describe their meaning:

- header - page or section header
- nav - navigation links
- main - main content
- article - independent content
- section - thematic grouping
- footer - page or section footer
- aside - sidebar content

## Example

```html
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main>
  <article>
    <h1>My Article</h1>
    <p>Article content here...</p>
  </article>
</main>

<footer>
  <p>Copyright 2026</p>
</footer>
```'
),
(
  '11111111-1111-1111-1111-111111111103',
  'CSS Fundamentals',
  'Module',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NULL,
  1,
  NULL
),
(
  '11111111-1111-1111-1111-111111111104',
  'CSS Selectors',
  'Article',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '11111111-1111-1111-1111-111111111103',
  0,
  '# CSS Selectors

Learn how to select and style HTML elements.

## Types of Selectors

### 1. Element Selector
Selects all elements of a given type.

```css
p { color: blue; }
h1 { font-size: 24px; }
```

### 2. Class Selector
Selects elements with a specific class attribute.

```css
.highlight { background-color: yellow; }
.button { padding: 10px 20px; }
```

### 3. ID Selector
Selects an element with a specific id attribute.

```css
#header { background-color: navy; }
#main-content { max-width: 1200px; }
```

### 4. Attribute Selector
Selects elements based on attribute values.

```css
[type="text"] { border: 1px solid gray; }
[href^="https"] { color: green; }
```

## Combining Selectors

```css
/* Descendant selector */
article p { line-height: 1.6; }

/* Child selector */
nav > ul { list-style: none; }

/* Adjacent sibling */
h1 + p { font-size: 1.2em; }

/* Multiple selectors */
h1, h2, h3 { font-family: Georgia; }
```

## Specificity

CSS specificity determines which styles apply when multiple rules target the same element:

1. Inline styles (highest)
2. ID selectors
3. Class, attribute, pseudo-class selectors
4. Element selectors (lowest)'
),
(
  '11111111-1111-1111-1111-111111111107',
  'CSS Box Model',
  'Article',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '11111111-1111-1111-1111-111111111103',
  1,
  '# The CSS Box Model

Every HTML element is a rectangular box. Understanding the box model is crucial for layout.

## Components of the Box Model

### 1. Content
The actual content of the element (text, images, etc.)

### 2. Padding
Space between the content and the border.

```css
.box {
  padding: 20px;           /* all sides */
  padding: 10px 20px;      /* vertical | horizontal */
  padding: 10px 20px 15px 25px; /* top | right | bottom | left */
}
```

### 3. Border
The edge around the padding.

```css
.box {
  border: 1px solid black;
  border-radius: 5px;
}
```

### 4. Margin
Space outside the border, between elements.

```css
.box {
  margin: 20px auto;  /* centers horizontally */
}
```

## Box Sizing

By default, width and height only apply to the content area. Use box-sizing to include padding and border:

```css
* {
  box-sizing: border-box;
}
```

## Example

```css
.card {
  width: 300px;
  padding: 20px;
  border: 2px solid #ddd;
  margin: 10px;
  box-sizing: border-box;
}
```'
),
(
  '11111111-1111-1111-1111-111111111105',
  'HTML Basics Quiz',
  'Quiz',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '11111111-1111-1111-1111-111111111101',
  1,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type;

-- Data Structures Course Pages
INSERT INTO course_pages (id, name, type, course_id, parent_id, "index", doc) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  'Arrays and Linked Lists',
  'Module',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  NULL,
  0,
  NULL
),
(
  '22222222-2222-2222-2222-222222222202',
  'Introduction to Arrays',
  'Article',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '22222222-2222-2222-2222-222222222201',
  0,
  '# Arrays

Arrays are contiguous memory locations that store elements of the same type.

## Time Complexity

| Operation | Complexity |
|-----------|------------|
| Access    | O(1)       |
| Search    | O(n)       |
| Insert    | O(n)       |
| Delete    | O(n)       |

## Array Operations in Python

```python
# Creating arrays
arr = [1, 2, 3, 4, 5]

# Accessing elements
first = arr[0]    # 1
last = arr[-1]    # 5

# Slicing
subset = arr[1:4]  # [2, 3, 4]

# Modifying
arr[0] = 10
arr.append(6)
arr.insert(0, 0)

# Removing
arr.pop()         # removes last
arr.remove(3)     # removes first occurrence of 3
```

## When to Use Arrays

Arrays are ideal when:
- You need fast access by index
- The size is known in advance
- You need to iterate through all elements
- Memory efficiency is important

## Common Array Algorithms

### Linear Search
```python
def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1
```

### Binary Search (sorted arrays)
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```'
),
(
  '22222222-2222-2222-2222-222222222204',
  'Linked Lists',
  'Article',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '22222222-2222-2222-2222-222222222201',
  1,
  '# Linked Lists

A linked list is a linear data structure where elements are stored in nodes, and each node points to the next.

## Types of Linked Lists

### 1. Singly Linked List
Each node has data and a pointer to the next node.

```python
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    
    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node
```

### 2. Doubly Linked List
Each node has pointers to both next and previous nodes.

### 3. Circular Linked List
The last node points back to the first node.

## Time Complexity

| Operation | Complexity |
|-----------|------------|
| Access    | O(n)       |
| Search    | O(n)       |
| Insert at head | O(1) |
| Insert at tail | O(n) |
| Delete    | O(n)       |

## Advantages over Arrays

- Dynamic size
- Efficient insertions/deletions at the beginning
- No memory waste from pre-allocation'
),
(
  '22222222-2222-2222-2222-222222222205',
  'DSA Quiz 1',
  'Quiz',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '22222222-2222-2222-2222-222222222201',
  2,
  NULL
),
(
  '22222222-2222-2222-2222-222222222203',
  'Trees and Graphs',
  'Module',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  NULL,
  1,
  NULL
),
(
  '22222222-2222-2222-2222-222222222206',
  'Binary Trees',
  'Article',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '22222222-2222-2222-2222-222222222203',
  0,
  '# Binary Trees

A binary tree is a hierarchical data structure where each node has at most two children, referred to as the left child and right child.

## Key Terms

- **Root**: The topmost node
- **Leaf**: A node with no children
- **Height**: Longest path from root to a leaf
- **Depth**: Distance from the root to a node

## Types of Binary Trees

### 1. Full Binary Tree
Every node has 0 or 2 children.

### 2. Complete Binary Tree
All levels are filled except possibly the last, which is filled left to right.

### 3. Perfect Binary Tree
All internal nodes have 2 children and all leaves are at the same level.

### 4. Binary Search Tree (BST)
Left subtree contains only nodes with values less than the parent. Right subtree contains only nodes with values greater than the parent.

## Tree Traversals

```python
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

# Inorder: Left, Root, Right
def inorder(node):
    if node:
        inorder(node.left)
        print(node.val)
        inorder(node.right)

# Preorder: Root, Left, Right
def preorder(node):
    if node:
        print(node.val)
        preorder(node.left)
        preorder(node.right)

# Postorder: Left, Right, Root
def postorder(node):
    if node:
        postorder(node.left)
        postorder(node.right)
        print(node.val)
```

## Time Complexity

| Operation | Average | Worst |
|-----------|---------|-------|
| Search    | O(log n)| O(n)  |
| Insert    | O(log n)| O(n)  |
| Delete    | O(log n)| O(n)  |'
),
(
  '22222222-2222-2222-2222-222222222207',
  'Graph Fundamentals',
  'Article',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '22222222-2222-2222-2222-222222222203',
  1,
  '# Graph Fundamentals

A graph is a collection of nodes (vertices) connected by edges.

## Graph Representations

### 1. Adjacency Matrix
A 2D array where matrix[i][j] = 1 if there is an edge from i to j.

```python
# For a graph with 4 vertices
graph = [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
]
```

### 2. Adjacency List
Each vertex stores a list of its neighbors.

```python
graph = {
    0: [1, 2],
    1: [0, 3],
    2: [0, 3],
    3: [1, 2]
}
```

## Graph Traversal

### Breadth-First Search (BFS)

```python
from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    
    while queue:
        node = queue.popleft()
        print(node)
        
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

### Depth-First Search (DFS)

```python
def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()
    
    visited.add(node)
    print(node)
    
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
```

## Common Graph Problems

- Shortest path (Dijkstra, Bellman-Ford)
- Minimum spanning tree (Prim, Kruskal)
- Topological sorting
- Cycle detection'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- ============================================================
-- STEP 6: Add questions for courses with proper UUIDs
-- ============================================================

INSERT INTO questions (id, type, question, answer, course_id, points, group_name, options, correct_option) VALUES
(
  '33333333-3333-3333-3333-333333333301',
  'MCQ',
  'What does HTML stand for?',
  '"HyperText Markup Language"',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  5,
  'HTML Basics',
  ARRAY['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Making Language'],
  0
),
(
  '33333333-3333-3333-3333-333333333302',
  'MCQ',
  'Which CSS property is used to change the text color?',
  '"color"',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  5,
  'CSS Basics',
  ARRAY['text-color', 'font-color', 'color', 'foreground-color'],
  2
),
(
  '33333333-3333-3333-3333-333333333303',
  'Text',
  'What HTML tag is used for the largest heading?',
  '"h1"',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  3,
  'HTML Basics',
  NULL,
  NULL
),
(
  '33333333-3333-3333-3333-333333333304',
  'MCQ',
  'What is the time complexity of accessing an element in an array by index?',
  '"O(1)"',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  5,
  'Arrays',
  ARRAY['O(n)', 'O(1)', 'O(log n)', 'O(n squared)'],
  1
),
(
  '33333333-3333-3333-3333-333333333305',
  'Numeric',
  'In a binary tree with 15 nodes, how many leaf nodes can there be at maximum?',
  '"8"',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  10,
  'Trees',
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question;

-- ============================================================
-- STEP 7: Add quiz questions (link questions to quizzes)
-- ============================================================

INSERT INTO quiz_questions (quiz_id, question_id, order_index) VALUES
('11111111-1111-1111-1111-111111111105', '33333333-3333-3333-3333-333333333301', 0),
('11111111-1111-1111-1111-111111111105', '33333333-3333-3333-3333-333333333302', 1),
('11111111-1111-1111-1111-111111111105', '33333333-3333-3333-3333-333333333303', 2),
('22222222-2222-2222-2222-222222222205', '33333333-3333-3333-3333-333333333304', 0),
('22222222-2222-2222-2222-222222222205', '33333333-3333-3333-3333-333333333305', 1)
ON CONFLICT (quiz_id, question_id) DO NOTHING;

-- ============================================================
-- STEP 8: Add some quiz attempts with proper UUIDs
-- ============================================================

INSERT INTO quiz_attempts (id, quiz_id, user_id, answers, score, correct_count, unanswered_count, started_at, ended_at) VALUES
(
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111105',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '[{"question_id": "33333333-3333-3333-3333-333333333301", "answer": 0, "correct": true}, {"question_id": "33333333-3333-3333-3333-333333333302", "answer": 2, "correct": true}, {"question_id": "33333333-3333-3333-3333-333333333303", "answer": "h1", "correct": true}]',
  13,
  3,
  0,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days' + INTERVAL '15 minutes'
),
(
  '44444444-4444-4444-4444-444444444402',
  '11111111-1111-1111-1111-111111111105',
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  '[{"question_id": "33333333-3333-3333-3333-333333333301", "answer": 1, "correct": false}, {"question_id": "33333333-3333-3333-3333-333333333302", "answer": 2, "correct": true}, {"question_id": "33333333-3333-3333-3333-333333333303", "answer": "H1", "correct": true}]',
  8,
  2,
  0,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days' + INTERVAL '12 minutes'
),
(
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111105',
  'f47ac10b-58cc-4372-a567-0e02b2c3d481',
  '[{"question_id": "33333333-3333-3333-3333-333333333301", "answer": 0, "correct": true}, {"question_id": "33333333-3333-3333-3333-333333333302", "answer": 0, "correct": false}]',
  5,
  1,
  1,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '8 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 9: Add course instructors
-- Note: course_instructors table links courses to users who are instructors
-- ============================================================

INSERT INTO course_instructors (course_id, user_id) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f47ac10b-58cc-4372-a567-0e02b2c3d491'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f47ac10b-58cc-4372-a567-0e02b2c3d492'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f47ac10b-58cc-4372-a567-0e02b2c3d491'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'f47ac10b-58cc-4372-a567-0e02b2c3d492'),
('d4e5f6a7-b8c9-0123-def0-234567890123', 'f47ac10b-58cc-4372-a567-0e02b2c3d491'),
('f6a7b8c9-d0e1-2345-f012-456789012345', 'f47ac10b-58cc-4372-a567-0e02b2c3d492')
ON CONFLICT (course_id, user_id) DO NOTHING;

-- ============================================================
-- STEP 10: Summary query to verify data
-- ============================================================

-- Run these to verify:
SELECT 'Courses' as table_name, COUNT(*) as count FROM courses
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Registrations', COUNT(*) FROM user_courses
UNION ALL
SELECT 'Course Pages', COUNT(*) FROM course_pages
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'Quiz Attempts', COUNT(*) FROM quiz_attempts
UNION ALL
SELECT 'Instructors', COUNT(*) FROM course_instructors;

-- ============================================================
-- HELPFUL QUERIES FOR TESTING
-- ============================================================

-- View all courses with student counts:
-- SELECT c.name, c.subtitle, COUNT(uc.user_id) as students
-- FROM courses c
-- LEFT JOIN user_courses uc ON c.id = uc.course_id
-- GROUP BY c.id, c.name, c.subtitle
-- ORDER BY students DESC;

-- View all users:
-- SELECT name, email, role FROM users ORDER BY role, name;

-- Make your real user an admin (replace with your actual email):
-- UPDATE users SET role = 'admin' WHERE email = 'your.email@example.com';

-- View registrations for a specific course:
-- SELECT u.name, u.email, u.bits_id, uc.registered_at
-- FROM user_courses uc
-- JOIN users u ON uc.user_id = u.id
-- WHERE uc.course_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ============================================================
-- MAKE YOUR USER AN ADMIN
-- ============================================================
-- IMPORTANT: You must sign in at least once BEFORE running this,
-- so that your user record exists in the database.
-- 
-- This updates the specified email to have admin role:
UPDATE users SET role = 'admin' WHERE email = 'f20230621@goa.pilani.ac.in';

-- Also try with the full Google email format (sometimes includes @gmail.com suffix)
UPDATE users SET role = 'admin' WHERE email LIKE 'f20230621%';

-- VERIFY: Check if your user exists and what role they have
SELECT id, email, role FROM users WHERE email LIKE '%f20230621%' OR email LIKE '%goa.pilani%';

-- If the above shows nothing, run this to see ALL users:
-- SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 20;

-- Then manually update by ID if needed:
-- UPDATE users SET role = 'admin' WHERE id = 'your-user-id-here';
