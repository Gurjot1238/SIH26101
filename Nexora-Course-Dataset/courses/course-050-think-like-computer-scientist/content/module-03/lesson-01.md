# Tuples

> Source: How to Think Like a Computer Scientist: Learning with Python. Allen Downey, Jeffrey Elkner, Chris Meyers.
> Official URL: https://www.greenteapress.com/thinkpython/thinkCSpy/html/chap09.html
> License: CC BY
> Reused without endorsement. Original copyright notices retained.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>).   
  
* * *

| [![Previous](images/prev.png)](<chap08.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap10.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

## Chapter 9

# Tuples

### 9.1 Mutability and tuples

So far, you have seen two compound types: strings, which are made up of characters; and lists, which are made up of elements of any type. One of the differences we noted is that the elements of a list can be modified, but the characters in a string cannot. In other words, strings are **immutable** and lists are **mutable**. 

There is another type in Python called a **tuple** that is similar to a list except that it is immutable. Syntactically, a tuple is a comma-separated list of values: 

`>>> tuple = 'a', 'b', 'c', 'd', 'e'   
`

Although it is not necessary, it is conventional to enclose tuples in parentheses: 

`>>> tuple = ('a', 'b', 'c', 'd', 'e')   
`

To create a tuple with a single element, we have to include the final comma: 

`>>> t1 = ('a',)   
>>> type(t1)   
<type 'tuple'>   
`

Without the comma, Python treats `('a')` as a string in parentheses: 

`>>> t2 = ('a')   
>>> type(t2)   
<type 'str'>   
`

Syntax issues aside, the operations on tuples are the same as the operations on lists. The index operator selects an element from a tuple. 

`>>> tuple = ('a', 'b', 'c', 'd', 'e')   
>>> tuple[0]   
'a'   
`

And the slice operator selects a range of elements. 

`>>> tuple[1:3]   
('b', 'c')   
`

But if we try to modify one of the elements of the tuple, we get an error: 

`>>> tuple[0] = 'A'   
TypeError: object doesn't support item assignment   
`

Of course, even if we can't modify the elements of a tuple, we can replace it with a different tuple: 

`>>> tuple = ('A',) + tuple[1:]   
>>> tuple   
('A', 'b', 'c', 'd', 'e')   
`

### 9.2 Tuple assignment

Once in a while, it is useful to swap the values of two variables. With conventional assignment statements, we have to use a temporary variable. For example, to swap `a` and `b`: 

`>>> temp = a   
>>> a = b   
>>> b = temp   
`

If we have to do this often, this approach becomes cumbersome. Python provides a form of **tuple assignment** that solves this problem neatly: 

`>>> a, b = b, a   
`

The left side is a tuple of variables; the right side is a tuple of values. Each value is assigned to its respective variable. All the expressions on the right side are evaluated before any of the assignments. This feature makes tuple assignment quite versatile. 

Naturally, the number of variables on the left and the number of values on the right have to be the same: 

`>>> a, b, c, d = 1, 2, 3   
ValueError: unpack tuple of wrong size   
`

### 9.3 Tuples as return values

Functions can return tuples as return values. For example, we could write a function that swaps two parameters: 

`def swap(x, y):   
return y, x   
`

Then we can assign the return value to a tuple with two variables: 

`a, b = swap(a, b)   
`

In this case, there is no great advantage in making `swap` a function. In fact, there is a danger in trying to encapsulate `swap`, which is the following tempting mistake: 

`def swap(x, y): # incorrect version   
x, y = y, x   
`

If we call this function like this: 

`swap(a, b)   
`

then `a` and `x` are aliases for the same value. Changing `x` inside `swap` makes `x` refer to a different value, but it has no effect on `a` in `__main__`. Similarly, changing `y` has no effect on `b`. 

This function runs without producing an error message, but it doesn't do what we intended. This is an example of a semantic error. 

> _As an exercise, draw a state diagram for this function so that you can see why it doesn't work._

### 9.4 Random numbers

Most computer programs do the same thing every time they execute, so they are said to be **deterministic**. Determinism is usually a good thing, since we expect the same calculation to yield the same result. For some applications, though, we want the computer to be unpredictable. Games are an obvious example, but there are more. 

Making a program truly nondeterministic turns out to be not so easy, but there are ways to make it at least seem nondeterministic. One of them is to generate random numbers and use them to determine the outcome of the program. Python provides a built-in function that generates **pseudorandom** numbers, which are not truly random in the mathematical sense, but for our purposes they will do. 

The `random` module contains a function called `random` that returns a floating-point number between 0.0 and 1.0. Each time you call `random`, you get the next number in a long series. To see a sample, run this loop: 

`import random   
  
for i in range(10):   
x = random.random()   
print x   
`

To generate a random number between 0.0 and an upper bound like `high`, multiply `x` by `high`. 

> _As an exercise, generate a random number between` low` and `high`._

> _As an additional exercise, generate a random _integer_ between `low` and `high`, including both end points._

### 9.5 List of random numbers

The first step is to generate a list of random values. `randomList` takes an integer argument and returns a list of random numbers with the given length. It starts with a list of `n` zeros. Each time through the loop, it replaces one of the elements with a random number. The return value is a reference to the complete list: 

`def randomList(n):   
s = [0] * n   
for i in range(n):   
s[i] = random.random()   
return s   
`

We'll test this function with a list of eight elements. For purposes of debugging, it is a good idea to start small. 

`>>> randomList(8)   
0.15156642489   
0.498048560109   
0.810894847068   
0.360371157682   
0.275119183077   
0.328578797631   
0.759199803101   
0.800367163582   
`

The numbers generated by `random` are supposed to be distributed uniformly, which means that every value is equally likely. 

If we divide the range of possible values into equal-sized "buckets," and count the number of times a random value falls in each bucket, we should get roughly the same number in each. 

We can test this theory by writing a program to divide the range into buckets and count the number of values in each. 

### 9.6 Counting

A good approach to problems like this is to divide the problem into subproblems and look for subproblems that fit a computational pattern you have seen before. 

In this case, we want to traverse a list of numbers and count the number of times a value falls in a given range. That sounds familiar. In [Section 7.8](<chap07.html#8>), we wrote a program that traversed a string and counted the number of times a given letter appeared. 

So, we can proceed by copying the old program and adapting it for the current problem. The original program was: 

`count = 0   
for char in fruit:   
if char == 'a':   
count = count + 1   
print count   
`

The first step is to replace `fruit` with `t` and `char` with `num`. That doesn't change the program; it just makes it more readable. 

The second step is to change the test. We aren't interested in finding letters. We want to see if `num` is between the given values `low` and `high`. 

`count = 0   
for num in t:   
if low < num < high:   
count = count + 1   
print count   
`

The last step is to encapsulate this code in a function called `inBucket`. The parameters are the list and the values `low` and `high`. 

`def inBucket(t, low, high):   
count = 0   
for num in t:   
if low < num < high:   
count = count + 1   
return count   
`

By copying and modifying an existing program, we were able to write this function quickly and save a lot of debugging time. This development plan is called **pattern matching**. If you find yourself working on a problem you have solved before, reuse the solution. 

### 9.7 Many buckets

As the number of buckets increases, `inBucket` gets a little unwieldy. With two buckets, it's not bad: 

`low = inBucket(a, 0.0, 0.5)   
high = inBucket(a, 0.5, 1)   
`

But with four buckets it is getting cumbersome. 

`bucket1 = inBucket(a, 0.0, 0.25)   
bucket2 = inBucket(a, 0.25, 0.5)   
bucket3 = inBucket(a, 0.5, 0.75)   
bucket4 = inBucket(a, 0.75, 1.0)   
`

There are two problems. One is that we have to make up new variable names for each result. The other is that we have to compute the range for each bucket. 

We'll solve the second problem first. If the number of buckets is `numBuckets`, then the width of each bucket is `1.0 / numBuckets`. 

We'll use a loop to compute the range of each bucket. The loop variable, `i`, counts from 0 to `numBuckets-1`: 

`bucketWidth = 1.0 / numBuckets   
for i in range(numBuckets):   
low = i * bucketWidth   
high = low + bucketWidth   
print low, "to", high   
`

To compute the low end of each bucket, we multiply the loop variable by the bucket width. The high end is just a `bucketWidth` away. 

With `numBuckets = 8`, the output is: 

`0.0 to 0.125   
0.125 to 0.25   
0.25 to 0.375   
0.375 to 0.5   
0.5 to 0.625   
0.625 to 0.75   
0.75 to 0.875   
0.875 to 1.0   
`

You can confirm that each bucket is the same width, that they don't overlap, and that they cover the entire range from 0.0 to 1.0. 

Now back to the first problem. We need a way to store eight integers, using the loop variable to indicate one at a time. By now you should be thinking, "List!" 

We have to create the bucket list outside the loop, because we only want to do it once. Inside the loop, we'll call `inBucket` repeatedly and update the `i`-eth element of the list: 

`numBuckets = 8   
buckets = [0] * numBuckets   
bucketWidth = 1.0 / numBuckets   
for i in range(numBuckets):   
low = i * bucketWidth   
high = low + bucketWidth   
buckets[i] = inBucket(t, low, high)   
print buckets   
`

With a list of 1000 values, this code produces this bucket list: 

`[138, 124, 128, 118, 130, 117, 114, 131]   
`

These numbers are fairly close to 125, which is what we expected. At least, they are close enough that we can believe the random number generator is working. 

> _As an exercise, test this function with some longer lists, and see if the number of values in each bucket tends to level off._

### 9.8 A single-pass solution

Although this program works, it is not as efficient as it could be. Every time it calls `inBucket`, it traverses the entire list. As the number of buckets increases, that gets to be a lot of traversals. 

It would be better to make a single pass through the list and compute for each value the index of the bucket in which it falls. Then we can increment the appropriate counter. 

In the previous section we took an index, `i`, and multiplied it by the `bucketWidth` to find the lower bound of a given bucket. Now we want to take a value in the range 0.0 to 1.0 and find the index of the bucket where it falls. 

Since this problem is the inverse of the previous problem, we might guess that we should divide by `bucketWidth` instead of multiplying. That guess is correct. 

Since `bucketWidth = 1.0 / numBuckets`, dividing by `bucketWidth` is the same as multiplying by `numBuckets`. If we multiply a number in the range 0.0 to 1.0 by `numBuckets`, we get a number in the range from 0.0 to `numBuckets`. If we round that number to the next lower integer, we get exactly what we are looking for ~~~~ a bucket index: 

`numBuckets = 8   
buckets = [0] * numBuckets   
for i in t:   
index = int(i * numBuckets)   
buckets[index] = buckets[index] + 1   
`

We used the `int` function to convert a floating-point number to an integer. 

Is it possible for this calculation to produce an index that is out of range (either negative or greater than `len(buckets)-1`)? 

A list like `buckets` that contains counts of the number of values in each range is called a **histogram**. 

> _As an exercise, write a function called` histogram` that takes a list and a number of buckets as arguments and returns a histogram with the given number of buckets._

### 9.9 Glossary

immutable type
    A type in which the elements cannot be modified. Assignments to elements or slices of immutable types cause an error.
mutable type
    A data type in which the elements can be modified. All mutable types are compound types. Lists and dictionaries are mutable data types; strings and tuples are not.
tuple
    A sequence type that is similar to a list except that it is immutable. Tuples can be used wherever an immutable type is required, such as a key in a dictionary.
tuple assignment
    An assignment to all of the elements in a tuple using a single assignment statement. Tuple assignment occurs in parallel rather than in sequence, making it useful for swapping values.
deterministic
    A program that does the same thing each time it is called.
pseudorandom
    A sequence of numbers that appear to be random but that are actually the result of a deterministic computation.
histogram
    A list of integers in which each element counts the number of times something happens.
pattern matching
    A program development plan that involves identifying a familiar computational pattern and copying the solution to a similar problem.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>). 

* * *

[![Previous](images/prev.png)](<chap08.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap10.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

