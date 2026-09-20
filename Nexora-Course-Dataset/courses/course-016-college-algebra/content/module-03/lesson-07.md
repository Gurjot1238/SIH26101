# 3.6 Absolute Value Functions

> Source: College Algebra. OpenStax / Rice University.
> Official URL: https://openstax.org/books/college-algebra/pages/3-6-absolute-value-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.6 Absolute Value Functions

### Learning Objectives

In this section, you will:

  * Graph an absolute value function.
  * Solve an absolute value equation.

![The Milky Way.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d78d5b954e217ab5e790857d208ec73c590c8781) Figure  1 Distances in deep space can be measured in all directions. As such, it is useful to consider distance in terms of absolute values. (credit: "s58y"/Flickr)

Until the 1920s, the so-called spiral nebulae were believed to be clouds of dust and gas in our own galaxy, some tens of thousands of light years away. Then, astronomer Edwin Hubble proved that these objects are galaxies in their own right, at distances of millions of light years. Today, astronomers can detect galaxies that are billions of light years away. Distances in the universe can be measured in all directions. As such, it is useful to consider distance as an absolute value function. In this section, we will continue our investigation of absolute value functions. 

### Understanding Absolute Value 

Recall that in its basic form  f(x)=| x |, f(x)=| x |, the absolute value function is one of our toolkit functions. The absolute value function is commonly thought of as providing the distance the number is from zero on a number line. Algebraically, for whatever the input value is, the output is the value without regard to sign. Knowing this, we can use absolute value functions to solve some kinds of real-world problems.

###  Absolute Value Function

The absolute value function can be defined as a piecewise function

f(x)=| x |={ x if x≥0 −x if x<0 f(x)=| x |={ x if x≥0 −x if x<0

###  Example  1

#### Using Absolute Value to Determine Resistance

Electrical parts, such as resistors and capacitors, come with specified values of their operating parameters: resistance, capacitance, etc. However, due to imprecision in manufacturing, the actual values of these parameters vary somewhat from piece to piece, even when they are supposed to be the same. The best that manufacturers can do is to try to guarantee that the variations will stay within a specified range, often  ±1%,±5%, ±1%,±5%, or  ±10%. ±10%.

Suppose we have a resistor rated at 680 ohms,  ±5%. ±5%. Use the absolute value function to express the range of possible values of the actual resistance.

####  Solution

We can find that 5% of 680 ohms is 34 ohms. The absolute value of the difference between the actual and nominal resistance should not exceed the stated variability, so, with the resistance  R R in ohms,

| R−680 |≤34 |R−680|≤34

###  Try It  #1

Students who score within 20 points of 80 will pass a test. Write this as a distance from 80 using absolute value notation. 

### Graphing an Absolute Value Function

The most significant feature of the absolute value graph is the corner point at which the graph changes direction. This point is shown at the origin in [Figure 2](<3-6-absolute-value-functions#Figure_01_06_003>).

![Graph of an absolute function](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f97d1919a813c2fd5ca42cf569cc617b01695d32) Figure  2

[Figure 3](<3-6-absolute-value-functions#Figure_01_06_004>) shows the graph of  y=2| x–3 |+4. y=2| x–3 |+4. The graph of  y=| x | y=| x | has been shifted right 3 units, vertically stretched by a factor of 2, and shifted up 4 units. This means that the corner point is located at  ( 3,4 ) ( 3,4 ) for this transformed function.

![Graph of the different types of transformations for an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/eab2f14a4a60fd1c639b2f1f8d74897f67c6c7b9) Figure  3

###  Example  2

#### Writing an Equation for an Absolute Value Function Given a Graph

Write an equation for the function graphed in [Figure 4](<3-6-absolute-value-functions#Figure_01_06_005>).

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7ac2f2030e89ac3e8e167a27f9acc82966bc691a) Figure  4

####  Solution

The basic absolute value function changes direction at the origin, so this graph has been shifted to the right 3 units and down 2 units from the basic toolkit function. See [Figure 5](<3-6-absolute-value-functions#Figure_01_06_006>).

![Graph of two transformations for an absolute function at \(3, -2\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ccf016bcce1dfbda630ffbaf613a2da35b8643f7) Figure  5

We also notice that the graph appears vertically stretched, because the width of the final graph on a horizontal line is not equal to 2 times the vertical distance from the corner to this line, as it would be for an unstretched absolute value function. Instead, the width is equal to 1 times the vertical distance as shown in [Figure 6](<3-6-absolute-value-functions#Figure_01_06_007>).

![Graph of two transformations for an absolute function at \(3, -2\) and describes the ratios between the two different transformations.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b405c358c2b8ac8c427059ba141ddcd94638b24f) Figure  6

From this information we can write the equation

f(x) = 2|x−3|−2, treating the stretch as avertical stretch,or f(x) = |2(x−3)|−2, treating the stretch as ahorizontal compression. f(x) = 2|x−3|−2, treating the stretch as avertical stretch,or f(x) = |2(x−3)|−2, treating the stretch as ahorizontal compression.

#### Analysis 

Note that these equations are algebraically equivalent—the stretch for an absolute value function can be written interchangeably as a vertical or horizontal stretch or compression. Note also that if the vertical stretch factor is negative, there is also a reflection about the x-axis.

###  Q&A

**If we couldn’t observe the stretch of the function from the graphs, could we algebraically determine it?**

_Yes. If we are unable to determine the stretch based on the width of the graph, we can solve for the stretch factor by putting in a known pair of values for x x and  f(x). f(x). _

f(x)=a|x−3|−2 f(x)=a|x−3|−2

_Now substituting in the point_(1, 2)

2 = a|1−3|−2 4 = 2a a = 2 2 = a|1−3|−2 4 = 2a a = 2

###  Try It  #2

Write the equation for the absolute value function that is horizontally shifted left 2 units, is vertically flipped, and vertically shifted up 3 units. 

###  Q&A

**Do the graphs of absolute value functions always intersect the vertical axis? The horizontal axis?**

_Yes, they always intersect the vertical axis. The graph of an absolute value function will intersect the vertical axis when the input is zero._

_No, they do not always intersect the horizontal axis. The graph may or may not intersect the horizontal axis, depending on how the graph has been shifted and reflected. It is possible for the absolute value function to intersect the horizontal axis at zero, one, or two points (see[Figure 7](<3-6-absolute-value-functions#Figure_01_06_008>)). _

![Graph of the different types of transformations for an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e2801a7ea5d45ec2456287a0a47cc6b869435373) Figure  7 (a) The absolute value function does not intersect the horizontal axis. (b) The absolute value function intersects the horizontal axis at one point. (c) The absolute value function intersects the horizontal axis at two points.

### Solving an Absolute Value Equation

In [Other Type of Equations](<2-6-other-types-of-equations>), we touched on the concepts of absolute value equations. Now that we understand a little more about their graphs, we can take another look at these types of equations. Now that we can graph an absolute value function, we will learn how to solve an absolute value equation. To solve an equation such as  8=| 2x−6 |, 8=| 2x−6 |, we notice that the absolute value will be equal to 8 if the quantity inside the absolute value is 8 or -8. This leads to two different equations we can solve independently.

2x−6 = 8 or 2x−6 = −8 2x = 14 2x = −2 x = 7 x = −1 2x−6 = 8 or 2x−6 = −8 2x = 14 2x = −2 x = 7 x = −1

Knowing how to solve problems involving absolute value functions is useful. For example, we may need to identify numbers or points on a line that are at a specified distance from a given reference point.

An absolute value equation is an equation in which the unknown variable appears in absolute value bars. For example,

| x |=4, | 2x−1 |=3,or | 5x+2 |−4=9 | x |=4, | 2x−1 |=3,or | 5x+2 |−4=9

###  Solutions to Absolute Value Equations

For real numbers  A A and  B B , an equation of the form  | A |=B, |A|=B, with  B≥0, B≥0, will have solutions when  A=B A=B or  A=−B. A=−B. If  B<0, B<0, the equation  | A |=B |A|=B has no solution.

###  How To

**Given the formula for an absolute value function, find the horizontal intercepts of its graph**.

  1. Isolate the absolute value term.
  2. Use  | A |=B | A |=B to write  A=B A=B or  −A=B, −A=B, assuming  B>0. B>0.
  3. Solve for  x. x.

###  Example  3

#### Finding the Zeros of an Absolute Value Function

For the function  f(x)=|4x+1|−7, f(x)=|4x+1|−7, find the values of  x x such that  f(x)=0. f(x)=0.

####  Solution

0 = |4x+1|−7 Substitute 0 for f(x). 7 = |4x+1| Isolate the absolute value on one side of the equation. 7 = 4x+1 or −7 = 4x+1 Break into two separate equations and solve. 6 = 4x −8 = 4x x = 6 4 =1.5 x = −8 4 =−2 0 = |4x+1|−7 Substitute 0 for f(x). 7 = |4x+1| Isolate the absolute value on one side of the equation. 7 = 4x+1 or −7 = 4x+1 Break into two separate equations and solve. 6 = 4x −8 = 4x x = 6 4 =1.5 x = −8 4 =−2

The function outputs 0 when  x= 3 2 x= 3 2 or  x=−2. x=−2. See [Figure 8](<3-6-absolute-value-functions#Figure_01_06_011>). 

![Graph an absolute function with x-intercepts at -2 and 1.5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d7a0c088c8378efda1ca1ad0cd472cd5de5388dc) Figure  8

###  Try It  #3

For the function  f(x)=| 2x−1 |−3, f(x)=| 2x−1 |−3, find the values of  x x such that  f(x)=0. f(x)=0.

###  Q&A

**Should we always expect two answers when solving | A |=B? | A |=B? **

_No. We may find one, two, or even no answers. For example, there is no solution to_ 2+| 3x−5 |=1. 2+| 3x−5 |=1.

###  Media

Access these online resources for additional instruction and practice with absolute value.

  * [Graphing Absolute Value Functions](<http://openstax.org/l/graphabsvalue>)
  * [Graphing Absolute Value Functions 2](<http://openstax.org/l/graphabsvalue2>)

###  3.6 Section Exercises

#### Verbal

[1](<chapter-3>). 

How do you solve an absolute value equation?

2. 

How can you tell whether an absolute value function has two _x_ -intercepts without graphing the function?

[3](<chapter-3>). 

When solving an absolute value function, the isolated absolute value term is equal to a negative number. What does that tell you about the graph of the absolute value function?

4. 

How can you use the graph of an absolute value function to determine the _x_ -values for which the function values are negative?

#### Algebraic

[5](<chapter-3>). 

Describe all numbers  x x that are at a distance of 4 from the number 8. Express this set of numbers using absolute value notation.

6. 

Describe all numbers  x x that are at a distance of  1 2 1 2 from the number −4. Express this set of numbers using absolute value notation.

[7](<chapter-3>). 

Describe the situation in which the distance that point  x x is from 10 is at least 15 units. Express this set of numbers using absolute value notation.

8. 

Find all function values  f(x) f(x) such that the distance from  f(x) f(x) to the value 8 is less than 0.03 units. Express this set of numbers using absolute value notation.

For the following exercises, find the _x_ \- and _y_ -intercepts of the graphs of each function.

[9](<chapter-3>). 

f(x)=4| x−3 |+4 f(x)=4| x−3 |+4

10. 

f(x)=−3| x−2 |−1 f(x)=−3| x−2 |−1

[11](<chapter-3>). 

f(x)=−2| x+1 |+6 f(x)=−2| x+1 |+6

12. 

f(x)=−5|x+2|+15 f(x)=−5|x+2|+15

[13](<chapter-3>). 

f(x)=2|x−1|−6 f(x)=2|x−1|−6

14. 

f(x)=|−2x+1|−13 f(x)=|−2x+1|−13

[15](<chapter-3>). 

f(x)=−|x−9|+16 f(x)=−|x−9|+16

#### Graphical

For the following exercises, graph the absolute value function. Plot at least five points by hand for each graph.

16. 

y=|x−1| y=|x−1|

[17](<chapter-3>). 

y=|x+1| y=|x+1|

18. 

y=|x|+1 y=|x|+1

For the following exercises, graph the given functions by hand.

[19](<chapter-3>). 

y=| x |−2 y=| x |−2

20. 

y=−| x | y=−| x |

[21](<chapter-3>). 

y=−| x |−2 y=−| x |−2

22. 

y=−| x−3 |−2 y=−| x−3 |−2

[23](<chapter-3>). 

f(x)=−|x−1|−2 f(x)=−|x−1|−2

24. 

f(x)=−|x+3|+4 f(x)=−|x+3|+4

[25](<chapter-3>). 

f(x)=2|x+3|+1 f(x)=2|x+3|+1

26. 

f(x)=3| x−2 |+3 f(x)=3| x−2 |+3

[27](<chapter-3>). 

f(x)=| 2x−4 |−3 f(x)=| 2x−4 |−3

28. 

f( x )=| 3x+9 |+2 f( x )=| 3x+9 |+2

[29](<chapter-3>). 

f(x)=−| x−1 |−3 f(x)=−| x−1 |−3

30. 

f(x)=−| x+4 |−3 f(x)=−| x+4 |−3

[31](<chapter-3>). 

f(x)= 1 2 | x+4 |−3 f(x)= 1 2 | x+4 |−3

#### Technology

32. 

Use a graphing utility to graph  f(x)=10|x−2| f(x)=10|x−2| on the viewing window  [ 0,4 ]. [ 0,4 ]. Identify the corresponding range. Show the graph.

[33](<chapter-3>). 

Use a graphing utility to graph  f(x)=−100|x|+100 f(x)=−100|x|+100 on the viewing window  [ −5,5 ]. [ −5,5 ]. Identify the corresponding range. Show the graph.

For the following exercises, graph each function using a graphing utility. Specify the viewing window.

34. 

f(x)=−0.1| 0.1(0.2−x) |+0.3 f(x)=−0.1| 0.1(0.2−x) |+0.3

[35](<chapter-3>). 

f(x)=4× 10 9 | x−(5× 10 9 ) |+2× 10 9 f(x)=4× 10 9 | x−(5× 10 9 ) |+2× 10 9

#### Extensions

For the following exercises, solve the inequality.

36. 

If possible, find all values of  a a such that there are no  x- x- intercepts for  f(x)=2| x+1 |+a. f(x)=2| x+1 |+a.

[37](<chapter-3>). 

If possible, find all values of  a a such that there are no  y y -intercepts for  f(x)=2| x+1 |+a. f(x)=2| x+1 |+a.

#### Real-World Applications

38. 

Cities A and B are on the same east-west line. Assume that city A is located at the origin. If the distance from city A to city B is at least 100 miles and  x x represents the distance from city B to city A, express this using absolute value notation.

[39](<chapter-3>). 

The true proportion  p p of people who give a favorable rating to Congress is 8% with a margin of error of 1.5%. Describe this statement using an absolute value equation.

40. 

Students who score within 18 points of the number 82 will pass a particular test. Write this statement using absolute value notation and use the variable  x x for the score.

[41](<chapter-3>). 

A machinist must produce a bearing that is within 0.01 inches of the correct diameter of 5.0 inches. Using  x x as the diameter of the bearing, write this statement using absolute value notation. 

42. 

The tolerance for a ball bearing is 0.01. If the true diameter of the bearing is to be 2.0 inches and the measured value of the diameter is  x x inches, express the tolerance using absolute value notation.

