# 1.7 Inverse Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/1-7-inverse-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 1.7 Inverse Functions

### Learning Objectives

In this section, you will:

  * Verify inverse functions.
  * Determine the domain and range of an inverse function, and restrict the domain of a function to make it one-to-one.
  * Find or evaluate the inverse of a function.
  * Use the graph of a one-to-one function to graph its inverse function on the same axes.

A reversible heat pump is a climate-control system that is an air conditioner and a heater in a single device. Operated in one direction, it pumps heat out of a house to provide cooling. Operating in reverse, it pumps heat into the building from the outside, even in cool weather, to provide heating. As a heater, a heat pump is several times more efficient than conventional electrical resistance heating.

If some physical machines can run in two directions, we might ask whether some of the function “machines” we have been studying can also run backwards. [Figure 1](<1-7-inverse-functions#Figure_01_07_001>) provides a visual representation of this question. In this section, we will consider the reverse nature of functions.

![Diagram of a function and would be its inverse.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b5bfb7d5ff4dfeb327564d64a7071e8a1608f65b) Figure  1 Can a function “machine” operate in reverse?

###  Verifying That Two Functions Are Inverse Functions

Suppose a fashion designer traveling to Milan for a fashion show wants to know what the temperature will be. He is not familiar with the Celsius scale. To get an idea of how temperature measurements are related, he asks his assistant, Betty, to convert 75 degrees Fahrenheit to degrees Celsius. She finds the formula

C= 5 9 (F−32) C= 5 9 (F−32)

and substitutes 75 for  F F to calculate

5 9 (75−32)≈24°C. 5 9 (75−32)≈24°C.

Knowing that a comfortable 75 degrees Fahrenheit is about 24 degrees Celsius, he sends his assistant the week’s weather forecast from [Figure 2](<1-7-inverse-functions#Figure_01_07_002>) for Milan, and asks her to convert all of the temperatures to degrees Fahrenheit.

![A forecast of Monday’s through Thursday’s weather.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3269ffa6058608835a4ec729a02a4d12b7c415d2) Figure  2

At first, Betty considers using the formula she has already found to complete the conversions. After all, she knows her algebra, and can easily solve the equation for  F F after substituting a value for  C. C. For example, to convert 26 degrees Celsius, she could write

26= 5 9 (F−32) 26⋅ 9 5 =F−32 F=26⋅ 9 5 +32≈79 26= 5 9 (F−32) 26⋅ 9 5 =F−32 F=26⋅ 9 5 +32≈79

After considering this option for a moment, however, she realizes that solving the equation for each of the temperatures will be awfully tedious. She realizes that since evaluation is easier than solving, it would be much more convenient to have a different formula, one that takes the Celsius temperature and outputs the Fahrenheit temperature.

The formula for which Betty is searching corresponds to the idea of an **inverse function** , which is a function for which the input of the original function becomes the output of the inverse function and the output of the original function becomes the input of the inverse function.

Given a function  f(x), f(x), we represent its inverse as  f −1 (x), f −1 (x), read as  “f “f inverse of  x.” x.” The raised  −1 −1 is part of the notation. It is not an exponent; it does not imply a power of  −1 −1. In other words,  f −1 (x) f −1 (x) does _not_ mean  1 f(x) 1 f(x) because  1 f(x) 1 f(x) is the reciprocal of  f f and not the inverse.

The “exponent-like” notation comes from an analogy between function composition and multiplication: just as  a −1 a=1 a −1 a=1 (1 is the identity element for multiplication) for any nonzero number  a, a, so  f −1 ∘f f −1 ∘f equals the identity function, that is,

( f −1 ∘f )(x)= f −1 ( f(x) )= f −1 ( y )=x ( f −1 ∘f )(x)= f −1 ( f(x) )= f −1 ( y )=x

This holds for all  x x in the domain of  f. f. Informally, this means that inverse functions “undo” each other. However, just as zero does not have a reciprocal, some functions do not have inverses.

Given a function  f(x), f(x), we can verify whether some other function  g(x) g(x) is the inverse of  f(x) f(x) by checking whether either  g(f(x))=x g(f(x))=x or  f(g(x))=x f(g(x))=x is true. We can test whichever equation is more convenient to work with because they are logically equivalent (that is, if one is true, then so is the other.)

For example,  y=4x y=4x and  y= 1 4 x y= 1 4 x are inverse functions.

( f −1 ∘f )(x)= f −1 ( 4x )= 1 4 ( 4x )=x ( f −1 ∘f )(x)= f −1 ( 4x )= 1 4 ( 4x )=x

and

( f ∘ f −1 )(x)=f( 1 4 x )=4( 1 4 x )=x ( f ∘ f −1 )(x)=f( 1 4 x )=4( 1 4 x )=x

A few coordinate pairs from the graph of the function  y=4x y=4x are (−2, −8), (0, 0), and (2, 8). A few coordinate pairs from the graph of the function  y= 1 4 x y= 1 4 x are (−8, −2), (0, 0), and (8, 2). If we interchange the input and output of each coordinate pair of a function, the interchanged coordinate pairs would appear on the graph of the inverse function.

###  Inverse Function

For any one-to-one function f(x)=y, f(x)=y, a function  f −1 ( x ) f −1 ( x ) is an inverse function of  f f if  f −1 (y)=x. f −1 (y)=x. This can also be written as  f −1 (f(x))=x f −1 (f(x))=x for all  x x in the domain of  f. f. It also follows that  f( f −1 (x))=x f( f −1 (x))=x for all  x x in the domain of  f −1 f −1 if  f −1 f −1 is the inverse of  f. f.

The notation  f −1 f −1 is read  “ f “ f inverse.” Like any other function, we can use any variable name as the input for  f −1 , f −1 , so we will often write  f −1 (x), f −1 (x), which we read as  “f “f inverse of  x.” x.” Keep in mind that

f −1 (x)≠ 1 f(x) f −1 (x)≠ 1 f(x)

and not all functions have inverses.

###  Example  1

#### Identifying an Inverse Function for a Given Input-Output Pair

If for a particular one-to-one function  f(2)=4 f(2)=4 and  f(5)=12, f(5)=12, what are the corresponding input and output values for the inverse function?

####  Solution

The inverse function reverses the input and output quantities, so if 

f(2)=4, then  f −1 (4)=2; f( 5 )=12, then f −1 ( 12 )=5. f(2)=4, then  f −1 (4)=2; f( 5 )=12, then f −1 ( 12 )=5.

Alternatively, if we want to name the inverse function  g, g, then  g(4)=2 g(4)=2 and  g(12)=5. g(12)=5.

#### Analysis 

Notice that if we show the coordinate pairs in a table form, the input and output are clearly reversed. See [Table 1](<1-7-inverse-functions#Table_01_07_01>).

( x,f(x) ) ( x,f(x) ) |  ( x,g(x) ) ( x,g(x) )  
---|---  
( 2,4 ) ( 2,4 ) |  ( 4,2 ) ( 4,2 )  
( 5,12 ) ( 5,12 ) |  ( 12,5 ) ( 12,5 )  
  
Table  1

###  Try It  #1

Given that  h −1 (6)=2, h −1 (6)=2, what are the corresponding input and output values of the original function  h? h?

###  How To

**Given two functions f(x) f(x) and  g(x), g(x), test whether the functions are inverses of each other.**

  1. Determine whether  f(g(x))=x f(g(x))=x or  g(f(x))=x. g(f(x))=x.
  2. If both statements are true, then  g= f −1 g= f −1 and  f= g −1 . f= g −1 . If either statement is false, then both are false, and  g≠ f −1 g≠ f −1 and  f≠ g −1 . f≠ g −1 .

###  Example  2

#### Testing Inverse Relationships Algebraically

If  f( x )= 1 x+2 f( x )= 1 x+2 and  g( x )= 1 x −2, g( x )= 1 x −2, is  g= f −1 ? g= f −1 ?

####  Solution

g(f(x))= 1 ( 1 x+2 ) −2 =x+2−2 =x g(f(x))= 1 ( 1 x+2 ) −2 =x+2−2 =x

so

g= f −1 and f= g −1 g= f −1 and f= g −1

This is enough to answer yes to the question, but we can also verify the other formula.

f(g(x))= 1 1 x −2+2 = 1 1 x =x f(g(x))= 1 1 x −2+2 = 1 1 x =x

#### Analysis 

Notice the inverse operations are in reverse order of the operations from the original function.

###  Try It  #2

If  f( x )= x 3 −4 f( x )= x 3 −4 and  g( x )= x+4 3 , g( x )= x+4 3 , is  g= f −1 ? g= f −1 ?

###  Example  3

#### Determining Inverse Relationships for Power Functions

If  f(x)= x 3 f(x)= x 3 (the cube function) and  g(x)= 1 3 x, g(x)= 1 3 x, is  g= f −1 ? g= f −1 ?

####  Solution

f( g( x ) )= x 3 27 ≠x f( g( x ) )= x 3 27 ≠x

No, the functions are not inverses.

#### Analysis 

The correct inverse to the cube is, of course, the cube root  x 3 = x 1 3 , x 3 = x 1 3 , that is, the one-third is an exponent, not a multiplier.

###  Try It  #3

If  f( x )= ( x−1 ) 3 andg( x )= x 3 +1, f( x )= ( x−1 ) 3 andg( x )= x 3 +1, is  g= f −1 ? g= f −1 ?

### Finding Domain and Range of Inverse Functions

The outputs of the function  f f are the inputs to  f −1 , f −1 , so the range of  f f is also the domain of  f −1 . f −1 . Likewise, because the inputs to  f f are the outputs of  f −1 , f −1 , the domain of  f f is the range of  f −1 . f −1 . We can visualize the situation as in [Figure 3](<1-7-inverse-functions#Figure_01_07_003>).

![Domain and range of a function and its inverse.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/acbf1888ab3ce9e5e55d4f78f057a91486598417) Figure  3 Domain and range of a function and its inverse

When a function has no inverse function, it is possible to create a new function where that new function on a limited domain does have an inverse function. For example, the inverse of  f(x)= x f(x)= x is  f −1 (x)= x 2 , f −1 (x)= x 2 , because a square “undoes” a square root; but the square is only the inverse of the square root on the domain  [ 0,∞ ), [ 0,∞ ), since that is the range of  f(x)= x . f(x)= x .

We can look at this problem from the other side, starting with the square (toolkit quadratic) function  f(x)= x 2 . f(x)= x 2 . If we want to construct an inverse to this function, we run into a problem, because for every given output of the quadratic function, there are two corresponding inputs (except when the input is 0). For example, the output 9 from the quadratic function corresponds to the inputs 3 and –3. But an output from a function is an input to its inverse; if this inverse input corresponds to more than one inverse output (input of the original function), then the “inverse” is not a function at all! To put it differently, the quadratic function is not a one-to-one function; it fails the horizontal line test, so it does not have an inverse function. In order for a function to have an inverse, it must be a one-to-one function.

In many cases, if a function is not one-to-one, we can still restrict the function to a part of its domain on which it is one-to-one. For example, we can make a restricted version of the square function  f(x)= x 2 f(x)= x 2 with its domain limited to  [ 0,∞ ), [ 0,∞ ), which is a one-to-one function (it passes the horizontal line test) and which has an inverse (the square-root function).

If  f(x)= ( x−1 ) 2 f(x)= ( x−1 ) 2 on  [ 1,∞ ), [ 1,∞ ), then the inverse function is  f −1 (x)= x +1. f −1 (x)= x +1.

  * The domain of  f f = range of  f −1 f −1 =  [ 1,∞ ). [ 1,∞ ).
  * The domain of  f −1 f −1 = range of  f f =  [ 0,∞ ). [ 0,∞ ).

###  Q&A

**Is it possible for a function to have more than one inverse?**

_No. If two supposedly different functions, say, g g and  h, h, both meet the definition of being inverses of another function  f, f, then you can prove that  g=h. g=h. We have just seen that some functions only have inverses if we restrict the domain of the original function. In these cases, there may be more than one way to restrict the domain, leading to different inverses. However, on any one domain, the original function still has only one unique inverse._

###  Domain and Range of Inverse Functions

The range of a function  f(x) f(x) is the domain of the inverse function  f −1 (x). f −1 (x).

The domain of  f(x) f(x) is the range of  f −1 (x). f −1 (x).

###  How To

**Given a function, find the domain and range of its inverse.**

  1. If the function is one-to-one, write the range of the original function as the domain of the inverse, and write the domain of the original function as the range of the inverse.
  2. If the domain of the original function needs to be restricted to make it one-to-one, then this restricted domain becomes the range of the inverse function.

###  Example  4

#### Finding the Inverses of Toolkit Functions

Identify which of the toolkit functions besides the quadratic function are not one-to-one, and find a restricted domain on which each function is one-to-one, if any. The toolkit functions are reviewed in [Table 2](<1-7-inverse-functions#Table_01_07_02>). We restrict the domain in such a fashion that the function assumes all _y_ -values exactly once.

Constant | Identity | Quadratic | Cubic | Reciprocal  
---|---|---|---|---  
f(x)=c f(x)=c |  f(x)=x f(x)=x |  f(x)= x 2 f(x)= x 2 |  f(x)= x 3 f(x)= x 3 |  f(x)= 1 x f(x)= 1 x  
Reciprocal squared | Cube root | Square root | Absolute value |   
f(x)= 1 x 2 f(x)= 1 x 2 |  f(x)= x 3 f(x)= x 3 |  f(x)= x f(x)= x |  f(x)=| x | f(x)=| x | |   
  
Table  2

####  Solution

The constant function is not one-to-one, and there is no domain (except a single point) on which it could be one-to-one, so the constant function has no meaningful inverse.

The absolute value function can be restricted to the domain  [ 0,∞ ), [ 0,∞ ), where it is equal to the identity function.

The reciprocal-squared function can be restricted to the domain  ( 0,∞ ). ( 0,∞ ).

#### Analysis 

We can see that these functions (if unrestricted) are not one-to-one by looking at their graphs, shown in [Figure 4](<1-7-inverse-functions#Figure_01_07_004>). They both would fail the horizontal line test. However, if a function is restricted to a certain domain so that it passes the horizontal line test, then in that restricted domain, it can have an inverse.

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/eb4bf4f204ebac34e6a2b0a5ac6d224a18cfe482) Figure  4 (a) Absolute value (b) Reciprocal squared

###  Try It  #4

The domain of function  f f is  (1,∞) (1,∞) and the range of function  f f is  (−∞,−2). (−∞,−2). Find the domain and range of the inverse function.

###  Finding and Evaluating Inverse Functions

Once we have a one-to-one function, we can evaluate its inverse at specific inverse function inputs or construct a complete representation of the inverse function in many cases.

#### Inverting Tabular Functions

Suppose we want to find the inverse of a function represented in table form. Remember that the domain of a function is the range of the inverse and the range of the function is the domain of the inverse. So we need to interchange the domain and range.

Each row (or column) of inputs becomes the row (or column) of outputs for the inverse function. Similarly, each row (or column) of outputs becomes the row (or column) of inputs for the inverse function.

###  Example  5

#### Interpreting the Inverse of a Tabular Function

A function  f(t) f(t) is given in [Table 3](<1-7-inverse-functions#Table_01_07_03>), showing distance in miles that a car has traveled in  t t minutes. Find and interpret  f −1 (70). f −1 (70).

** t (minutes) t (minutes) ** | 30 | 50 | 70 | 90  
---|---|---|---|---  
** f( t ) (miles) f( t ) (miles) ** | 20 | 40 | 60 | 70  
  
Table  3

####  Solution

The inverse function takes an output of  f f and returns an input for  f. f. So in the expression  f −1 (70), f −1 (70), 70 is an output value of the original function, representing 70 miles. The inverse will return the corresponding input of the original function  f, f, 90 minutes, so  f −1 (70)=90. f −1 (70)=90. The interpretation of this is that, to drive 70 miles, it took 90 minutes.

Alternatively, recall that the definition of the inverse was that if  f(a)=b, f(a)=b, then  f −1 (b)=a. f −1 (b)=a. By this definition, if we are given  f −1 (70)=a, f −1 (70)=a, then we are looking for a value  a a so that  f(a)=70. f(a)=70. In this case, we are looking for a  t t so that  f(t)=70, f(t)=70, which is when  t=90. t=90.

###  Try It  #5

Using [Table 4](<1-7-inverse-functions#Table_01_07_04>), find and interpret (a)  f(60), f(60), and (b)  f −1 (60). f −1 (60).

t (minutes) t (minutes) | 30 | 50 | 60 | 70 | 90  
---|---|---|---|---|---  
f( t ) (miles) f( t ) (miles) | 20 | 40 | 50 | 60 | 70  
  
Table  4

#### Evaluating the Inverse of a Function, Given a Graph of the Original Function

We saw in [Functions and Function Notation](<1-1-functions-and-function-notation>) that the domain of a function can be read by observing the horizontal extent of its graph. We find the domain of the inverse function by observing the _vertical_ extent of the graph of the original function, because this corresponds to the horizontal extent of the inverse function. Similarly, we find the range of the inverse function by observing the _horizontal_ extent of the graph of the original function, as this is the vertical extent of the inverse function. If we want to evaluate an inverse function, we find its input within its domain, which is all or part of the vertical axis of the original function’s graph.

###  How To

**Given the graph of a function, evaluate its inverse at specific points.**

  1. Find the desired input on the _y_ -axis of the given graph.
  2. Read the inverse function’s output from the _x_ -axis of the given graph.

###  Example  6

#### Evaluating a Function and Its Inverse from a Graph at Specific Points 

A function  g(x) g(x) is given in [Figure 5](<1-7-inverse-functions#Figure_01_07_006>). Find  g(3) g(3) and  g −1 (3). g −1 (3).

![Graph of g\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ff1738c65c16a8b0dcc69d62a6a8322a8384baff) Figure  5

####  Solution

To evaluate  g(3), g(3), we find 3 on the _x_ -axis and find the corresponding output value on the _y_ -axis. The point  ( 3,1 ) ( 3,1 ) tells us that  g(3)=1. g(3)=1.

To evaluate  g −1 (3), g −1 (3), recall that by definition  g −1 (3) g −1 (3) means the value of _x_ for which  g(x)=3. g(x)=3. By looking for the output value 3 on the vertical axis, we find the point  ( 5,3 ) ( 5,3 ) on the graph, which means  g(5)=3, g(5)=3, so by definition,  g −1 (3)=5. g −1 (3)=5. See [Figure 6](<1-7-inverse-functions#Figure_01_07_007>).

![Graph of g\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4c6df889133daf2fc25fec8986563d68013d32d5) Figure  6

###  Try It  #6

Using the graph in [Figure 6](<1-7-inverse-functions#Figure_01_07_007>), (a) find  g −1 (1), g −1 (1), and (b) estimate  g −1 (4). g −1 (4).

#### Finding Inverses of Functions Represented by Formulas

Sometimes we will need to know an inverse function for all elements of its domain, not just a few. If the original function is given as a formula— for example,  y y as a function of  x—  x—  we can often find the inverse function by solving to obtain  x x as a function of  y. y.

###  How To

**Given a function represented by a formula, find the inverse.**

  1. Make sure  f f is a one-to-one function.
  2. Solve for  x. x.
  3. Interchange  x x and  y. y.

###  Example  7

#### Inverting the Fahrenheit-to-Celsius Function

Find a formula for the inverse function that gives Fahrenheit temperature as a function of Celsius temperature.

C= 5 9 (F−32) C= 5 9 (F−32)

####  Solution

C= 5 9 (F−32) C⋅ 9 5 =F−32 F= 9 5 C+32 C= 5 9 (F−32) C⋅ 9 5 =F−32 F= 9 5 C+32

By solving in general, we have uncovered the inverse function. If

C=h(F)= 5 9 (F−32), C=h(F)= 5 9 (F−32),

then

F= h −1 (C)= 9 5 C+32. F= h −1 (C)= 9 5 C+32.

In this case, we introduced a function  h h to represent the conversion because the input and output variables are descriptive, and writing  C −1 C −1 could get confusing.

###  Try It  #7

Solve for  x x in terms of  y y given  y= 1 3 (x−5) y= 1 3 (x−5)

###  Example  8

#### Solving to Find an Inverse Function

Find the inverse of the function  f( x )= 2 x−3 +4. f( x )= 2 x−3 +4.

####  Solution

y= 2 x−3 +4 Set up an equation. y−4= 2 x−3 Subtract 4 from both sides. x−3= 2 y−4 Multiply both sides by x−3 and divide by y−4. x= 2 y−4 +3 Add 3 to both sides. y= 2 x−3 +4 Set up an equation. y−4= 2 x−3 Subtract 4 from both sides. x−3= 2 y−4 Multiply both sides by x−3 and divide by y−4. x= 2 y−4 +3 Add 3 to both sides.

So  f −1 ( y )= 2 y−4 +3 f −1 ( y )= 2 y−4 +3 or  f −1 ( x )= 2 x−4 +3. f −1 ( x )= 2 x−4 +3.

#### Analysis 

The domain and range of  f f exclude the values 3 and 4, respectively.  f f and  f −1 f −1 are equal at two points but are not the same function, as we can see by creating [Table 5](<1-7-inverse-functions#Table_01_07_05>).

** x x ** | 1 | 2 | 5 |  f −1 (y) f −1 (y)  
---|---|---|---|---  
** f(x) f(x) ** | 3 | 2 | 5 |  y y  
  
Table  5

###  Example  9

#### Solving to Find an Inverse with Radicals

Find the inverse of the function  f(x)=2+ x−4 . f(x)=2+ x−4 .

####  Solution

y=2+ x−4 (y−2) 2 =x−4 x= (y−2) 2 +4 y=2+ x−4 (y−2) 2 =x−4 x= (y−2) 2 +4

So  f −1 ( x )= ( x−2 ) 2 +4. f −1 ( x )= ( x−2 ) 2 +4.

The domain of  f f is  [4,∞). [4,∞). Notice that the range of  f f is  [2,∞), [2,∞), so this means that the domain of the inverse function  f −1 f −1 is also  [2,∞). [2,∞).

#### Analysis 

The formula we found for  f −1 ( x ) f −1 ( x ) looks like it would be valid for all real  x. x. However,  f −1 f −1 itself must have an inverse (namely,  f f ) so we have to restrict the domain of  f −1 f −1 to  [2,∞) [2,∞) in order to make  f −1 f −1 a one-to-one function. This domain of  f −1 f −1 is exactly the range of  f. f.

###  Try It  #8

What is the inverse of the function  f(x)=2− x ? f(x)=2− x ? State the domains of both the function and the inverse function.

### Finding Inverse Functions and Their Graphs

Now that we can find the inverse of a function, we will explore the graphs of functions and their inverses. Let us return to the quadratic function  f(x)= x 2 f(x)= x 2 restricted to the domain  [0,∞), [0,∞), on which this function is one-to-one, and graph it as in [Figure 7](<1-7-inverse-functions#Figure_01_07_008>).

![Graph of f\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8f66e93de59c724bedce64c6e6630e889460cc50) Figure  7 Quadratic function with domain restricted to [0, ∞).

Restricting the domain to  [0,∞) [0,∞) makes the function one-to-one (it will obviously pass the horizontal line test), so it has an inverse on this restricted domain.

We already know that the inverse of the toolkit quadratic function is the square root function, that is,  f −1 (x)= x . f −1 (x)= x . What happens if we graph both  f f and  f −1 f −1 on the same set of axes, using the  x- x- axis for the input to both  f and  f −1 ? f and  f −1 ?

We notice a distinct relationship: The graph of  f −1 (x) f −1 (x) is the graph of  f(x) f(x) reflected about the diagonal line  y=x, y=x, which we will call the identity line, shown in [Figure 8](<1-7-inverse-functions#Figure_01_07_009>).

![Graph of f\(x\) and f^\(-1\)\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c7879dbe7e07e5185519aae7e9ec37d07f0baf29) Figure  8 Square and square-root functions on the non-negative domain

This relationship will be observed for all one-to-one functions, because it is a result of the function and its inverse swapping inputs and outputs. This is equivalent to interchanging the roles of the vertical and horizontal axes.

###  Example  10

#### Finding the Inverse of a Function Using Reflection about the Identity Line

Given the graph of  f(x) f(x) in [Figure 9](<1-7-inverse-functions#Figure_01_07_010>), sketch a graph of  f −1 (x). f −1 (x).

![Graph of f^\(-1\)\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7d5a592d09bb9dd48a13cd38d7f88bf1cf4c7721) Figure  9

####  Solution

This is a one-to-one function, so we will be able to sketch an inverse. Note that the graph shown has an apparent domain of  ( 0,∞ ) ( 0,∞ ) and range of  ( −∞,∞ ), ( −∞,∞ ), so the inverse will have a domain of  ( −∞,∞ ) ( −∞,∞ ) and range of  ( 0,∞ ). ( 0,∞ ).

If we reflect this graph over the line  y=x, y=x, the point  ( 1,0 ) ( 1,0 ) reflects to  ( 0,1 ) ( 0,1 ) and the point  ( 4,2 ) ( 4,2 ) reflects to  ( 2,4 ). ( 2,4 ). Sketching the inverse on the same axes as the original graph gives [Figure 10](<1-7-inverse-functions#Figure_01_07_011>).

![Graph of f\(x\) and f^\(-1\)\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/26f4275a884f10f911350ca7adf71530642b9a57) Figure  10 The function and its inverse, showing reflection about the identity line

###  Try It  #9

Draw graphs of the functions  f f and  f −1 f −1 from [Example 8](<1-7-inverse-functions#Example_01_07_09>).

###  Q&A

**Is there any function that is equal to its own inverse?**

_Yes. If f= f −1 , f= f −1 , then  f( f( x ) )=x, f( f( x ) )=x, and we can think of several functions that have this property. The identity function does, and so does the reciprocal function, because_

1 1 x =x 1 1 x =x

_Any function f( x )=c−x, f( x )=c−x, where  c c is a constant, is also equal to its own inverse._

###  Media

Access these online resources for additional instruction and practice with inverse functions.

  * [Inverse Functions](<http://openstax.org/l/inversefunction>)
  * [Inverse Function Values Using Graph](<http://openstax.org/l/inversfuncgraph>)
  * [Restricting the Domain and Finding the Inverse](<http://openstax.org/l/restrictdomain>)

###  1.7 Section Exercises

#### Verbal

[1](<chapter-1>). 

Describe why the horizontal line test is an effective way to determine whether a function is one-to-one?

2. 

Why do we restrict the domain of the function  f(x)= x 2 f(x)= x 2 to find the function’s inverse?

[3](<chapter-1>). 

Can a function be its own inverse? Explain.

4. 

Are one-to-one functions either always increasing or always decreasing? Why or why not?

[5](<chapter-1>). 

How do you find the inverse of a function algebraically?

#### Algebraic

6. 

Show that the function  f(x)=a−x f(x)=a−x is its own inverse for all real numbers  a. a.

For the following exercises, find  f −1 (x) f −1 (x) for each function.

[7](<chapter-1>). 

f(x)=x+3 f(x)=x+3

8. 

f(x)=x+5 f(x)=x+5

[9](<chapter-1>). 

f(x)=2−x f(x)=2−x

10. 

f(x)=3−x f(x)=3−x

[11](<chapter-1>). 

f(x)= x x+2 f(x)= x x+2

12. 

f(x)= 2x+3 5x+4 f(x)= 2x+3 5x+4

For the following exercises, find a domain on which each function  f f is one-to-one and non-decreasing. Write the domain in interval notation. Then find the inverse of  f f restricted to that domain.

[13](<chapter-1>). 

f(x)= (x+7) 2 f(x)= (x+7) 2

14. 

f(x)= (x−6) 2 f(x)= (x−6) 2

[15](<chapter-1>). 

f(x)= x 2 −5 f(x)= x 2 −5

[16](<chapter-1>). 

Given  f( x )= x 2+x f( x )= x 2+x and  g(x)= 2x 1−x : g(x)= 2x 1−x :

  1. ⓐ Find  f(g(x)) f(g(x)) and  g(f(x)). g(f(x)).
  2. ⓑ What does the answer tell us about the relationship between  f(x) f(x) and  g(x)? g(x)?

For the following exercises, use function composition to verify that  f(x) f(x) and  g(x) g(x) are inverse functions.

[17](<chapter-1>). 

f(x)= x−1 3 f(x)= x−1 3 and  g(x)= x 3 +1 g(x)= x 3 +1

18. 

f(x)=−3x+5 f(x)=−3x+5 and  g(x)= x−5 −3 g(x)= x−5 −3

#### Graphical

For the following exercises, use a graphing utility to determine whether each function is one-to-one.

[19](<chapter-1>). 

f(x)= x f(x)= x

20. 

f(x)= 3x+1 3 f(x)= 3x+1 3

[21](<chapter-1>). 

f(x)=−5x+1 f(x)=−5x+1

22. 

f(x)= x 3 −27 f(x)= x 3 −27

For the following exercises, determine whether the graph represents a one-to-one function.

[23](<chapter-1>). 

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/56fab2253bff5efe179ab198174772dbd5197d07)

24. 

![Graph of a step-function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e8997181f0141a17bd0c3edddd6cc4efb3f1711e)

For the following exercises, use the graph of  f f shown in [Figure 11](<1-7-inverse-functions#Figure_01_07_203>).

![Graph of a line.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/26f2ba8a8772aea3ccf19ba807bdaaf370062068) Figure  11

[25](<chapter-1>). 

Find  f( 0 ). f( 0 ).

26. 

Solve  f(x)=0. f(x)=0.

[27](<chapter-1>). 

Find  f −1 ( 0 ). f −1 ( 0 ).

28. 

Solve  f −1 ( x )=0. f −1 ( x )=0.

For the following exercises, use the graph of the one-to-one function shown in [Figure 12](<1-7-inverse-functions#Figure_01_07_204>).

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3b9996cca90247c129cb9c761b8075600de4b7ab) Figure  12

[29](<chapter-1>). 

Sketch the graph of  f −1 . f −1 .

30. 

Find  f(6) and  f −1 (2). f(6) and  f −1 (2).

[31](<chapter-1>). 

If the complete graph of  f f is shown, find the domain of  f. f.

32. 

If the complete graph of  f f is shown, find the range of  f. f.

#### Numeric

For the following exercises, evaluate or solve, assuming that the function  f f is one-to-one.

[33](<chapter-1>). 

If  f(6)=7, f(6)=7, find  f −1 (7). f −1 (7).

34. 

If  f(3)=2, f(3)=2, find  f −1 (2). f −1 (2).

[35](<chapter-1>). 

If  f −1 ( −4 )=−8, f −1 ( −4 )=−8, find  f(−8). f(−8).

36. 

If  f −1 ( −2 )=−1, f −1 ( −2 )=−1, find  f(−1). f(−1).

For the following exercises, use the values listed in [Table 6](<1-7-inverse-functions#Table_01_07_06>) to evaluate or solve.

x x | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9  
---|---|---|---|---|---|---|---|---|---|---  
f(x) f(x) | 8 | 0 | 7 | 4 | 2 | 6 | 5 | 3 | 9 | 1  
  
Table  6

[37](<chapter-1>). 

Find  f( 1 ). f( 1 ).

38. 

Solve  f(x)=3. f(x)=3.

[39](<chapter-1>). 

Find  f −1 ( 0 ). f −1 ( 0 ).

40. 

Solve  f −1 ( x )=7. f −1 ( x )=7.

[41](<chapter-1>). 

Use the tabular representation of  f f in [Table 7](<1-7-inverse-functions#Table_01_07_08>) to create a table for  f −1 ( x ). f −1 ( x ).

** x x ** | 3 | 6 | 9 | 13 | 14  
---|---|---|---|---|---  
** f(x) f(x) ** | 1 | 4 | 7 | 12 | 16  
  
Table  7

#### Technology

For the following exercises, find the inverse function. Then, graph the function and its inverse.

42. 

f(x)= 3 x−2 f(x)= 3 x−2

[43](<chapter-1>). 

f(x)= x 3 −1 f(x)= x 3 −1

44. 

Find the inverse function of  f(x)= 1 x−1 . f(x)= 1 x−1 . Use a graphing utility to find its domain and range. Write the domain and range in interval notation.

#### Real-World Applications

[45](<chapter-1>). 

To convert from  x x degrees Celsius to  y y degrees Fahrenheit, we use the formula  f(x)= 9 5 x+32. f(x)= 9 5 x+32. Find the inverse function, if it exists, and explain its meaning. 

46. 

The circumference  C C of a circle is a function of its radius given by  C(r)=2πr. C(r)=2πr. Express the radius of a circle as a function of its circumference. Call this function  r(C). r(C). Find  r(36π) r(36π) and interpret its meaning.

[47](<chapter-1>). 

A car travels at a constant speed of 50 miles per hour. The distance the car travels in miles is a function of time,  t, t, in hours given by  d(t)=50t. d(t)=50t. Find the inverse function by expressing the time of travel in terms of the distance traveled. Call this function  t(d). t(d). Find  t(180) t(180) and interpret its meaning.

