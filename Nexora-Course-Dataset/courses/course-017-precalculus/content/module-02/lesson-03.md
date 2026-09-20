# 2.2 Graphs of Linear Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/2-2-graphs-of-linear-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 2.2 Graphs of Linear Functions

### Learning Objectives

In this section, you will:

  * Graph linear functions.
  * Write the equation for a linear function from the graph of a line.
  * Given the equations of two lines, determine whether their graphs are parallel or perpendicular.
  * Write the equation of a line parallel or perpendicular to a given line.
  * Solve a system of linear equations.

Two competing telephone companies offer different payment plans. The two plans charge the same rate per long distance minute, but charge a different monthly flat fee. A consumer wants to determine whether the two plans will ever cost the same amount for a given number of long distance minutes used. The total cost of each payment plan can be represented by a linear function. To solve the problem, we will need to compare the functions. In this section, we will consider methods of comparing functions using graphs.

### Graphing Linear Functions

In [Linear Functions](<2-1-linear-functions>), we saw that that the graph of a linear function is a straight line. We were also able to see the points of the function as well as the initial value from a graph. By graphing two functions, then, we can more easily compare their characteristics.

There are three basic methods of graphing linear functions. The first is by plotting points and then drawing a line through the points. The second is by using the _y-_ intercept and slope. And the third is by using transformations of the identity function f(x)=x.f(x)=x.

#### Graphing a Function by Plotting Points

To find points of a function, we can choose input values, evaluate the function at these input values, and calculate output values. The input values and corresponding output values form coordinate pairs. We then plot the coordinate pairs on a grid. In general, we should evaluate the function at a minimum of two inputs in order to find at least two points on the graph. For example, given the function, f(x)=2x,f(x)=2x, we might use the input values 1 and 2. Evaluating the function for an input value of 1 yields an output value of 2, which is represented by the point (1,2).(1,2). Evaluating the function for an input value of 2 yields an output value of 4, which is represented by the point (2,4).(2,4). Choosing three points is often advisable because if all three points do not fall on the same line, we know we made an error.

###  How To

**Given a linear function, graph by plotting points.**

  1. Choose a minimum of two input values.
  2. Evaluate the function at each input value.
  3. Use the resulting output values to identify coordinate pairs.
  4. Plot the coordinate pairs on a grid.
  5. Draw a line through the points.

###  Example  1

#### Graphing by Plotting Points

Graph f(x)=−23x+5f(x)=−23x+5 by plotting points.

####  Solution

Begin by choosing input values. This function includes a fraction with a denominator of 3, so let’s choose multiples of 3 as input values. We will choose 0, 3, and 6.

Evaluate the function at each input value, and use the output value to identify coordinate pairs.

x=0 f(0)=− 2 3 (0)+5=5⇒( 0,5 ) x=3 f(3)=− 2 3 (3)+5=3⇒( 3,3 ) x=6 f(6)=− 2 3 (6)+5=1⇒( 6,1 ) x=0 f(0)=− 2 3 (0)+5=5⇒( 0,5 ) x=3 f(3)=− 2 3 (3)+5=3⇒( 3,3 ) x=6 f(6)=− 2 3 (6)+5=1⇒( 6,1 )

Plot the coordinate pairs and draw a line through the points. [Figure 1](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_001>) represents the graph of the function f(x)=−23x+5.f(x)=−23x+5.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/24f1218b070a0504b55038c27f2fc9790304a136) Figure  1 The graph of the linear function f(x)=−23x+5.f(x)=−23x+5.

#### Analysis

The graph of the function is a line as expected for a linear function. In addition, the graph has a downward slant, which indicates a negative slope. This is also expected from the negative constant rate of change in the equation for the function.

###  Try It  #1

Graph f(x)=−34x+6f(x)=−34x+6 by plotting points.

#### Graphing a Function Using _y-_ intercept and Slope

Another way to graph linear functions is by using specific characteristics of the function rather than plotting points. The first characteristic is its _y-_ intercept, which is the point at which the input value is zero. To find the _y-_ intercept, we can set x=0x=0 in the equation.

The other characteristic of the linear function is its slope m,m, which is a measure of its steepness. Recall that the slope is the rate of change of the function. The slope of a function is equal to the ratio of the change in outputs to the change in inputs. Another way to think about the slope is by dividing the vertical difference, or rise, by the horizontal difference, or run. We encountered both the _y-_ intercept and the slope in [Linear Functions](<2-1-linear-functions>).

Let’s consider the following function.

f(x)=12x+1f(x)=12x+1

The slope is 12.12. Because the slope is positive, we know the graph will slant upward from left to right. The _y-_ intercept is the point on the graph when x=0.x=0. The graph crosses the _y_ -axis at (0,1).(0,1). Now we know the slope and the _y_ -intercept. We can begin graphing by plotting the point (0,1)(0,1) We know that the slope is rise over run, m=riserun.m=riserun. From our example, we have m=12,m=12, which means that the rise is 1 and the run is 2. So starting from our _y_ -intercept (0,1),(0,1), we can rise 1 and then run 2, or run 2 and then rise 1. We repeat until we have a few points, and then we draw a line through the points as shown in [Figure 2](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_003>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fa8d440278a4d73105cd08756daceb00bac43939) Figure  2

###  Graphical Interpretation of a Linear Function

In the equation f(x)=mx+bf(x)=mx+b

  * bb is the _y_ -intercept of the graph and indicates the point (0,b)(0,b) at which the graph crosses the _y_ -axis.
  * mm is the slope of the line and indicates the vertical displacement (rise) and horizontal displacement (run) between each successive pair of points. Recall the formula for the slope:

m= change in output (rise) change in input (run) = Δy Δx = y 2 − y 1 x 2 − x 1 m= change in output (rise) change in input (run) = Δy Δx = y 2 − y 1 x 2 − x 1

###  Q&A

**Do all linear functions have _y_ -intercepts?**

_Yes. All linear functions cross the y-axis and therefore have y-intercepts._ (Note: _A vertical line parallel to the y-axis does not have a y-intercept, but it is not a function._)

###  How To

**Given the equation for a linear function, graph the function using the _y_ -intercept and slope.**

  1. Evaluate the function at an input value of zero to find the _y-_ intercept.
  2. Identify the slope as the rate of change of the input value.
  3. Plot the point represented by the _y-_ intercept.
  4. Use riserunriserun to determine at least two more points on the line.
  5. Sketch the line that passes through the points.

###  Example  2

#### Graphing by Using the _y-_ intercept and Slope

Graph f(x)=−23x+5f(x)=−23x+5 using the _y-_ intercept and slope.

####  Solution

Evaluate the function at x=0x=0 to find the _y-_ intercept. The output value when x=0x=0 is 5, so the graph will cross the _y_ -axis at (0,5).(0,5).

According to the equation for the function, the slope of the line is −23.−23. This tells us that for each vertical decrease in the “rise” of –2–2 units, the “run” increases by 3 units in the horizontal direction. We can now graph the function by first plotting the _y_ -intercept on the graph in [Figure 3](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_004>). From the initial value (0,5)(0,5) we move down 2 units and to the right 3 units. We can extend the line to the left and right by repeating, and then draw a line through the points.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/06eec60511986086ec1b534fd3082df0d9f7be5d) Figure  3

#### Analysis 

The graph slants downward from left to right, which means it has a negative slope as expected.

###  Try It  #2

Find a point on the graph we drew in [Example 2](<2-2-graphs-of-linear-functions#Example_02_02_02>) that has a negative _x_ -value.

#### Graphing a Function Using Transformations

Another option for graphing is to use transformations of the identity function f(x)=xf(x)=x. A function may be transformed by a shift up, down, left, or right. A function may also be transformed using a reflection, stretch, or compression.

##### Vertical Stretch or Compression

In the equation f(x)=mx,f(x)=mx, the mm is acting as the vertical stretch or compression of the identity function. When mm is negative, there is also a vertical reflection of the graph. Notice in [Figure 4](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_005>) that multiplying the equation of f(x)=xf(x)=x by mm stretches the graph of ff by a factor of mm units if m>1m>1 and compresses the graph of ff by a factor of mm units if 0<m<1.0<m<1. This means the larger the absolute value of m,m, the steeper the slope.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c022489323343d3f67bbc9b025766d0cc7fbe1b2) Figure  4 Vertical stretches and compressions and reflections on the function f(x)=x.f(x)=x.

##### Vertical Shift

In f(x)=mx+b,f(x)=mx+b, the bb acts as the vertical shift, moving the graph up and down without affecting the slope of the line. Notice in [Figure 5](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_006>) that adding a value of bb to the equation of f(x)=xf(x)=x shifts the graph of ff a total of bb units up if bb is positive and |b||b| units down if bb is negative.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0120bf1497785e3d10342ceca2ddf50bf6a0d285) Figure  5 This graph illustrates vertical shifts of the function f(x)=x.f(x)=x.

Using vertical stretches or compressions along with vertical shifts is another way to look at identifying different types of linear functions. Although this may not be the easiest way to graph this type of function, it is still important to practice each method.

###  How To

**Given the equation of a linear function, use transformations to graph the linear function in the form f(x)=mx+b.f(x)=mx+b. **

  1. Graph f(x)=x.f(x)=x.
  2. Vertically stretch or compress the graph by a factor m.m.
  3. Shift the graph up or down bb units.

###  Example  3

#### Graphing by Using Transformations

Graph f(x)=12x−3f(x)=12x−3 using transformations.

####  Solution

The equation for the function shows that m=12m=12 so the identity function is vertically compressed by 12.12. The equation for the function also shows that b=−3b=−3 so the identity function is vertically shifted down 3 units. First, graph the identity function, and show the vertical compression as in [Figure 6](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_007>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d5621b67f6db03da1c64ec9b78f685850687e2a2) Figure  6 The function, y=x,y=x, compressed by a factor of 12.12.

Then show the vertical shift as in [Figure 7](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_008>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fa6330d94e6f7cd4b4fcc0bd7d135a06f1c34dd2) Figure  7 The function y=12x,y=12x, shifted down 3 units.

###  Try It  #3

Graph f(x)=4+2x,f(x)=4+2x, using transformations.

###  Q&A

**In[Example 3](<2-2-graphs-of-linear-functions#Example_02_02_03>), could we have sketched the graph by reversing the order of the transformations?**

_No. The order of the transformations follows the order of operations. When the function is evaluated at a given input, the corresponding output is calculated by following the order of operations. This is why we performed the compression first. For example, following the order: Let the input be 2._

f(2)= 1 2 (2)−3 =1−3 =−2 f(2)= 1 2 (2)−3 =1−3 =−2

### Writing the Equation for a Function from the Graph of a Line

Recall that in [Linear Functions](<2-1-linear-functions>), we wrote the equation for a linear function from a graph. Now we can extend what we know about graphing linear functions to analyze graphs a little more closely. Begin by taking a look at [Figure 8](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_010>). We can see right away that the graph crosses the _y_ -axis at the point (0, 4)(0, 4) so this is the _y_ -intercept.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/20978dd1c42fbfaed1ae1cf037172664543b42fb) Figure  8

Then we can calculate the slope by finding the rise and run. We can choose any two points, but let’s look at the point  (−2,0). (−2,0). To get from this point to the _y-_ intercept, we must move up 4 units (rise) and to the right 2 units (run). So the slope must be

m= rise run = 4 2 =2 m= rise run = 4 2 =2

Substituting the slope and _y-_ intercept into the slope-intercept form of a line gives

y=2x+4y=2x+4

###  How To

**Given a graph of linear function, find the equation to describe the function.**

  1. Identify the _y-_ intercept of an equation.
  2. Choose two points to determine the slope.
  3. Substitute the _y-_ intercept and slope into the slope-intercept form of a line.

###  Example  4

#### Matching Linear Functions to Their Graphs

Match each equation of the linear functions with one of the lines in [Figure 9](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_011>).

  1. ⓐ f(x)=2x+3f(x)=2x+3
  2. ⓑ g(x)=2x−3g(x)=2x−3
  3. ⓒ h(x)=−2x+3h(x)=−2x+3
  4. ⓓ j(x)=12x+3j(x)=12x+3

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f7b53aade291d174c12865880e32db6f0bf8bb5d) Figure  9

####  Solution

Analyze the information for each function.

  1. ⓐ This function has a slope of 2 and a _y_ -intercept of 3. It must pass through the point (0, 3) and slant upward from left to right. We can use two points to find the slope, or we can compare it with the other functions listed. Function gg has the same slope, but a different _y-_ intercept. Lines I and III have the same slant because they have the same slope. Line III does not pass through ( 0, 3)( 0, 3) so ff must be represented by Line I.
  2. ⓑ This function also has a slope of 2, but a _y_ -intercept of −3.−3. It must pass through the point (0,−3)(0,−3) and slant upward from left to right. It must be represented by Line III.
  3. ⓒ This function has a slope of –2 and a _y-_ intercept of 3. This is the only function listed with a negative slope, so it must be represented by line IV because it slants downward from left to right.
  4. ⓓ This function has a slope of 1212 and a _y-_ intercept of 3. It must pass through the point (0, 3) and slant upward from left to right. Lines I and II pass through (0, 3),(0, 3), but the slope of jj is less than the slope of ff so the line for jj must be flatter. This function is represented by Line II.

Now we can re-label the lines as in [Figure 10](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_012>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/909fbcd4ca1913a9ca3982b1f6378884c83b8fc8) Figure  10

### Finding the _x_ -intercept of a Line

So far, we have been finding the _y-_ intercepts of a function: the point at which the graph of the function crosses the _y_ -axis. A function may also have an **_x_****-intercept,** which is the _x_ -coordinate of the point where the graph of the function crosses the _x_ -axis. In other words, it is the input value when the output value is zero.

To find the _x_ -intercept, set a function f(x)f(x) equal to zero and solve for the value of x.x. For example, consider the function shown.

f(x)=3x−6f(x)=3x−6

Set the function equal to 0 and solve for x.x.

0=3x−6 6=3x 2=x x=2 0=3x−6 6=3x 2=x x=2

The graph of the function crosses the _x_ -axis at the point (2, 0).(2, 0).

###  Q&A

**Do all linear functions have _x_ -intercepts?**

_No. However, linear functions of the form y=c,y=c, where cc is a nonzero real number are the only examples of linear functions with no x-intercept. For example, y=5y=5 is a horizontal line 5 units above the x-axis. This function has no x-intercepts,_ as shown in [Figure 11](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_026>).

![Graph of y = 5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/40b2b8330494676467a30bf2f2f3aa3a28c0c2a6) Figure  11

###  _x_ -intercept

The _x_ -intercept of the function is value of xx when f(x)=0.f(x)=0. It can be solved by the equation 0=mx+b.0=mx+b.

###  Example  5

#### Finding an _x_ -intercept

Find the _x_ -intercept of f(x)=12x−3.f(x)=12x−3.

####  Solution

Set the function equal to zero to solve for x.x.

0= 1 2 x−3 3= 1 2 x 6=x x=6 0= 1 2 x−3 3= 1 2 x 6=x x=6

The graph crosses the _x_ -axis at the point (6, 0).(6, 0).

#### Analysis 

A graph of the function is shown in [Figure 12](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_013>). We can see that the _x_ -intercept is (6, 0)(6, 0) as we expected.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8504d6a1e9bda608b826e94f0b0ebbcd62e6f523) Figure  12 The graph of the linear function f(x)=12x−3.f(x)=12x−3.

###  Try It  #4

Find the _x_ -intercept of f(x)=14x−4.f(x)=14x−4.

### Describing Horizontal and Vertical Lines

There are two special cases of lines on a graph—horizontal and vertical lines. A **horizontal line** indicates a constant output, or _y_ -value. In [Figure 13](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_014>), we see that the output has a value of 2 for every input value. The change in outputs between any two points, therefore, is 0. In the slope formula, the numerator is 0, so the slope is 0. If we use m=0m=0 in the equation f(x)=mx+b,f(x)=mx+b, the equation simplifies to f(x)=b.f(x)=b. In other words, the value of the function is a constant. This graph represents the function f(x)=2.f(x)=2.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ef1eca76a5381668fc88461826818c2a424abc92) Figure  13 A horizontal line representing the function f(x)=2.f(x)=2.

A **vertical line** indicates a constant input, or _x_ -value. We can see that the input value for every point on the line is 2, but the output value varies. Because this input value is mapped to more than one output value, a vertical line does not represent a function. Notice that between any two points, the change in the input values is zero. In the slope formula, the denominator will be zero, so the slope of a vertical line is undefined.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7f86347d3fbfab18c5d60f08b188e16a3be7c53d)

Notice that a vertical line, such as the one in [Figure 14](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_016>)**,** has an _x_ -intercept, but no _y-_ intercept unless it’s the line x=0.x=0. This graph represents the line  x=2. x=2.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1f5db247564ebd77f64450ef6f56236c697c9845) Figure  14 The vertical line, x=2,x=2, which does not represent a function.

###  Horizontal and Vertical Lines

Lines can be horizontal or vertical.

A horizontal line is a line defined by an equation in the form f(x)=b.f(x)=b.

A vertical line is a line defined by an equation in the form x=a.x=a.

###  Example  6

#### Writing the Equation of a Horizontal Line

Write the equation of the line graphed in [Figure 15](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_017>).

![Graph of x = 7.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/08a09fd01931090d77f86969906dac20ea4dde4c) Figure  15

####  Solution

For any _x_ -value, the _y_ -value is −4,−4, so the equation is y=−4.y=−4.

###  Example  7

#### Writing the Equation of a Vertical Line

Write the equation of the line graphed in [Figure 16](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_018>).

![Graph of two functions where the baby blue line is y = -2/3x + 7, and the blue line is y = -x + 1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5ec73bef22ec31066cdd58fa116e79ac4e60b5de) Figure  16

####  Solution

The constant _x_ -value is 7,7, so the equation is x=7.x=7.

### Determining Whether Lines are Parallel or Perpendicular 

The two lines in [Figure 17](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_019>) are **parallel** **lines** : they will never intersect. Notice that they have exactly the same steepness, which means their slopes are identical. The only difference between the two lines is the _y_ -intercept. If we shifted one line vertically toward the _y_ -intercept of the other, they would become the same line.

![Graph of two functions where the blue line is y = -2/3x + 1, and the baby blue line is y = -2/3x +7. Notice that they are parallel lines.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f3e3b6cadf256a648642efc7a4bbf57d0ab390b0) Figure  17 Parallel lines.

We can determine from their equations whether two lines are parallel by comparing their slopes. If the slopes are the same and the _y_ -intercepts are different, the lines are parallel. If the slopes are different, the lines are not parallel.

f(x)=−2x+6 f(x)=−2x−4 }parallel f(x)=3x+2 f(x)=2x+2 }not parallel f(x)=−2x+6 f(x)=−2x−4 }parallel f(x)=3x+2 f(x)=2x+2 }not parallel

Unlike parallel lines,**perpendicular lines** do intersect. Their intersection forms a right, or 90-degree, angle. The two lines in [Figure 18](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_020>) are perpendicular.

![Graph of two functions where the blue line is perpendicular to the orange line.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b85bb4f6442dce99139acce18785a00feb15b039) Figure  18 Perpendicular lines.

Perpendicular lines do not have the same slope. The slopes of perpendicular lines are different from one another in a specific way. The slope of one line is the negative reciprocal of the slope of the other line. The product of a number and its reciprocal is 1. So, if m1m1 and m2m2 are negative reciprocals of one another, they can be multiplied together to yield –1. 

m1m2=−1m1m2=−1

To find the reciprocal of a number, divide 1 by the number. So the reciprocal of 8 is 18,18, and the reciprocal of 1818 is 8. To find the negative reciprocal, first find the reciprocal and then change the sign.

As with parallel lines, we can determine whether two lines are perpendicular by comparing their slopes, assuming that the lines are neither horizontal nor vertical. The slope of each line below is the negative reciprocal of the other so the lines are perpendicular.

f(x)= 1 4 x+2 negative reciprocal of 1 4 is −4 f(x)=−4x+3 negative reciprocal of−4 is  1 4 f(x)= 1 4 x+2 negative reciprocal of 1 4 is −4 f(x)=−4x+3 negative reciprocal of−4 is  1 4

The product of the slopes is –1.

−4(14)=−1−4(14)=−1

###  Parallel and Perpendicular Lines

Two lines are parallel lines if they do not intersect. The slopes of the lines are the same.

f(x)=m1x+b1 and g(x)=m2x+b2 are parallel if m1=m2.f(x)=m1x+b1 and g(x)=m2x+b2 are parallel if m1=m2.

If and only if b1=b2b1=b2 and m1=m2,m1=m2, we say the lines coincide. Coincident lines are the same line.

Two lines are perpendicular lines if they intersect at right angles.

f(x)= m 1 x+ b 1 and g(x)= m 2 x+ b 2 are perpendicular if  m 1 m 2 =−1, and so  m 2 =− 1 m 1 . f(x)= m 1 x+ b 1 and g(x)= m 2 x+ b 2 are perpendicular if  m 1 m 2 =−1, and so  m 2 =− 1 m 1 .

###  Example  8

#### Identifying Parallel and Perpendicular Lines

Given the functions below, identify the functions whose graphs are a pair of parallel lines and a pair of perpendicular lines.

f(x)=2x+3 h(x)=−2x+2 g(x)= 1 2 x−4 j(x)=2x−6 f(x)=2x+3 h(x)=−2x+2 g(x)= 1 2 x−4 j(x)=2x−6

####  Solution

Parallel lines have the same slope. Because the functions f(x)=2x+3f(x)=2x+3 and  j(x)=2x−6 j(x)=2x−6 each have a slope of 2, they represent parallel lines. Perpendicular lines have negative reciprocal slopes. Because −2 and 1212 are negative reciprocals, the equations, g(x)=12x−4g(x)=12x−4 and h(x)=−2x+2h(x)=−2x+2 represent perpendicular lines.

#### Analysis 

A graph of the lines is shown in [Figure 19](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_021>).

![Graph of four functions where the blue line is h\(x\) = -2x + 2, the orange line is f\(x\) = 2x + 3, the green line is j\(x\) = 2x - 6, and the red line is g\(x\) = 1/2x - 4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4645f08e433b9ec202d22feee234504a8c2cca5e) Figure  19

The graph shows that the lines f(x)=2x+3f(x)=2x+3 and j(x)=2x–6j(x)=2x–6 are parallel, and the lines g(x)=12x–4g(x)=12x–4 and h(x)=−2x+2h(x)=−2x+2 are perpendicular.

### Writing the Equation of a Line Parallel or Perpendicular to a Given Line

If we know the equation of a line, we can use what we know about slope to write the equation of a line that is either parallel or perpendicular to the given line.

#### Writing Equations of Parallel Lines

Suppose for example, we are given the following equation.

f(x)=3x+1f(x)=3x+1

We know that the slope of the line formed by the function is 3. We also know that the _y-_ intercept is (0,1).(0,1). Any other line with a slope of 3 will be parallel to f(x).f(x). So the lines formed by all of the following functions will be parallel to f(x).f(x).

g(x)=3x+6 h(x)=3x+1 p(x)=3x+ 2 3 g(x)=3x+6 h(x)=3x+1 p(x)=3x+ 2 3

Suppose then we want to write the equation of a line that is parallel to ff and passes through the point (1, 7).(1, 7). We already know that the slope is 3. We just need to determine which value for bb will give the correct line. We can begin with the point-slope form of an equation for a line, and then rewrite it in the slope-intercept form.

y− y 1 =m(x− x 1 ) y−7=3(x−1) y−7=3x−3 y=3x+4 y− y 1 =m(x− x 1 ) y−7=3(x−1) y−7=3x−3 y=3x+4

So g(x)=3x+4g(x)=3x+4 is parallel to f(x)=3x+1f(x)=3x+1 and passes through the point (1, 7).(1, 7).

###  How To

**Given the equation of a function and a point through which its graph passes, write the equation of a line parallel to the given line that passes through the given point.**

  1. Find the slope of the function.
  2. Substitute the given values into either the general point-slope equation or the slope-intercept equation for a line.
  3. Simplify.

###  Example  9

#### Finding a Line Parallel to a Given Line

Find a line parallel to the graph of f(x)=3x+6f(x)=3x+6 that passes through the point (3, 0).(3, 0).

####  Solution

The slope of the given line is 3. If we choose the slope-intercept form, we can substitute m=3,m=3, x=3,x=3, and f(x)=0f(x)=0 into the slope-intercept form to find the _y-_ intercept.

g(x)=3x+b 0=3(3)+b b=–9 g(x)=3x+b 0=3(3)+b b=–9

The line parallel to f(x)f(x) that passes through (3, 0)(3, 0) is g(x)=3x−9.g(x)=3x−9.

#### Analysis 

We can confirm that the two lines are parallel by graphing them. [Figure 20](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_022>) shows that the two lines will never intersect.

![Graph of two functions where the blue line is y = 3x + 6, and the orange line is y = 3x - 9.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3df6fe7bbdbd5a9087689a061502ac3cb0f42d72) Figure  20

#### Writing Equations of Perpendicular Lines

We can use a very similar process to write the equation for a line perpendicular to a given line. Instead of using the same slope, however, we use the negative reciprocal of the given slope. Suppose we are given the following function:

f(x)=2x+4f(x)=2x+4

The slope of the line is 2, and its negative reciprocal is −12.−12. Any function with a slope of −12−12 will be perpendicular to f(x).f(x). So the lines formed by all of the following functions will be perpendicular to f(x).f(x).

g(x)=− 1 2 x+4 h(x)=− 1 2 x+2 p(x)=− 1 2 x− 1 2 g(x)=− 1 2 x+4 h(x)=− 1 2 x+2 p(x)=− 1 2 x− 1 2

As before, we can narrow down our choices for a particular perpendicular line if we know that it passes through a given point. Suppose then we want to write the equation of a line that is perpendicular to f(x)f(x) and passes through the point (4, 0).(4, 0). We already know that the slope is −12.−12. Now we can use the point to find the _y_ -intercept by substituting the given values into the slope-intercept form of a line and solving for b.b.

g(x)=mx+b 0=− 1 2 (4)+b 0=−2+b 2=b b=2 g(x)=mx+b 0=− 1 2 (4)+b 0=−2+b 2=b b=2

The equation for the function with a slope of −12−12 and a _y-_ intercept of 2 is

g(x)=−12x+2.g(x)=−12x+2.

So g(x)=−12x+2g(x)=−12x+2 is perpendicular to f(x)=2x+4f(x)=2x+4 and passes through the point (4, 0).(4, 0). Be aware that perpendicular lines may not look obviously perpendicular on a graphing calculator unless we use the square zoom feature.

###  Q&A

**A horizontal line has a slope of zero and a vertical line has an undefined slope. These two lines are perpendicular, but the product of their slopes is not –1. Doesn’t this fact contradict the definition of perpendicular lines?**

_No. For two perpendicular linear functions, the product of their slopes is –1. However, a vertical line is not a function so the definition is not contradicted._

###  How To

**Given the equation of a function and a point through which its graph passes, write the equation of a line perpendicular to the given line.**

  1. Find the slope of the function.
  2. Determine the negative reciprocal of the slope.
  3. Substitute the new slope and the values for xx and yy from the coordinate pair provided into g(x)=mx+b.g(x)=mx+b.
  4. Solve for b.b.
  5. Write the equation for the line.

###  Example  10

#### Finding the Equation of a Perpendicular Line

Find the equation of a line perpendicular to f(x)=3x+3f(x)=3x+3 that passes through the point (3, 0).(3, 0).

####  Solution

The original line has slope m=3,m=3, so the slope of the perpendicular line will be its negative reciprocal, or −13.−13. Using this slope and the given point, we can find the equation for the line.

g(x)=– 1 3 x+b 0=– 1 3 (3)+b 1=b b=1 g(x)=– 1 3 x+b 0=– 1 3 (3)+b 1=b b=1

The line perpendicular to f(x)f(x) that passes through (3, 0)(3, 0) is g(x)=−13x+1.g(x)=−13x+1.

#### Analysis 

A graph of the two lines is shown in [Figure 21](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_023>) below.

![Graph of two functions where the blue line is g\(x\) = -1/3x + 1, and the orange line is f\(x\) = 3x + 6.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/52441a4936624d9ed85a7faf72714893310ccf8e) Figure  21

###  Try It  #5

Given the function h(x)=2x−4,h(x)=2x−4, write an equation for the line passing through (0,0)(0,0) that is 

  1. ⓐ parallel to h(x)h(x)
  2. ⓑ perpendicular to h(x)h(x)

###  How To

**Given two points on a line and a third point, write the equation of the perpendicular line that passes through the point.**

  1. Determine the slope of the line passing through the points.
  2. Find the negative reciprocal of the slope.
  3. Use the slope-intercept form or point-slope form to write the equation by substituting the known values.
  4. Simplify.

###  Example  11

#### Finding the Equation of a Line Perpendicular to a Given Line Passing through a Point

A line passes through the points (−2, 6)(−2, 6) and (4,5).(4,5). Find the equation of a perpendicular line that passes through the point (4,5).(4,5).

####  Solution

From the two points of the given line, we can calculate the slope of that line.

m 1 = 5−6 4−(−2) = −1 6 =− 1 6 m 1 = 5−6 4−(−2) = −1 6 =− 1 6

Find the negative reciprocal of the slope.

m 2 = −1 − 1 6 =−1( − 6 1 ) =6 m 2 = −1 − 1 6 =−1( − 6 1 ) =6

We can then solve for the _y-_ intercept of the line passing through the point (4,5).(4,5).

g(x)=6x+b 5=6(4)+b 5=24+b −19=b b=−19 g(x)=6x+b 5=6(4)+b 5=24+b −19=b b=−19

The equation for the line that is perpendicular to the line passing through the two given points and also passes through point (4,5)(4,5) is

y=6x−19y=6x−19

###  Try It  #6

A line passes through the points,  (−2,−15) (−2,−15) and  (2,−3). (2,−3). Find the equation of a perpendicular line that passes through the point,  (6,4). (6,4).

### Solving a System of Linear Equations Using a Graph

A system of linear equations includes two or more linear equations. The graphs of two lines will intersect at a single point if they are not parallel. Two parallel lines can also intersect if they are coincident, which means they are the same line and they intersect at every point. For two lines that are not parallel, the single point of intersection will satisfy both equations and therefore represent the solution to the system.

To find this point when the equations are given as functions, we can solve for an input value so that f(x)=g(x).f(x)=g(x). In other words, we can set the formulas for the lines equal to one another, and solve for the input that satisfies the equation.

###  Example  12

#### Finding a Point of Intersection Algebraically

Find the point of intersection of the lines h(t)=3t−4h(t)=3t−4 and j(t)=5−t.j(t)=5−t.

####  Solution

Set h(t)=j(t).h(t)=j(t).

3t−4=5−t 4t=9 t= 9 4 3t−4=5−t 4t=9 t= 9 4

This tells us the lines intersect when the input is 94.94.

We can then find the output value of the intersection point by evaluating either function at this input.

j( 9 4 )=5− 9 4 = 11 4 j( 9 4 )=5− 9 4 = 11 4

These lines intersect at the point (94,114).(94,114).

#### Analysis 

Looking at [Figure 22](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_024>), this result seems reasonable.

![Graph of two functions h\(t\) = 3t - 4 and j\(t\) = t +5 and their intersection at \(9/4, 11/4\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cdf84503358e384c3867e460c493e0aca15d19b9) Figure  22

###  Q&A

**If we were asked to find the point of intersection of two distinct parallel lines, should something in the solution process alert us to the fact that there are no solutions?**

_Yes. After setting the two equations equal to one another, the result would be the contradiction “0 = non-zero real number”._

###  Try It  #7

Look at the graph in [Figure 22](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_024>) and identify the following for the function j(t):j(t):

  1. ⓐ _y-_ intercept
  2. ⓑ _x_ -intercept(s)
  3. ⓒ slope
  4. ⓓ Is j(t)j(t) parallel or perpendicular to h(t)h(t) (or neither)?
  5. ⓔ Is j(t)j(t) an increasing or decreasing function (or neither)?
  6. ⓕ Write a transformation description for j(t)j(t) from the identity toolkit function f(x)=x.f(x)=x.

###  Example  13

#### Finding a Break-Even Point

A company sells sports helmets. The company incurs a one-time fixed cost for $250,000. Each helmet costs $120 to produce, and sells for $140.

  1. ⓐ Find the cost function, C,C, to produce xx helmets, in dollars.
  2. ⓑ Find the revenue function, R,R, from the sales of xx helmets, in dollars.
  3. ⓒ Find the break-even point, the point of intersection of the two graphs CC and R.R.

####  Solution

  1. ⓐ The cost function in the sum of the fixed cost, $125,000, and the variable cost, $120 per helmet. 

C(x)=120x+250,000C(x)=120x+250,000

  2. ⓑ The revenue function is the total revenue from the sale of xx helmets, R(x)=140x.R(x)=140x.
  3. ⓒ The break-even point is the point of intersection of the graph of the cost and revenue functions. To find the _x_ -coordinate of the coordinate pair of the point of intersection, set the two equations equal, and solve for x.x.

C(x)=R(x) 250,000+120x=140x 250,000=20x 12,500=x x=12,500 C(x)=R(x) 250,000+120x=140x 250,000=20x 12,500=x x=12,500

To find y,y, evaluate either the revenue or the cost function at 12,500.

R(x)=140(12,500) =$1,750,000 R(x)=140(12,500) =$1,750,000

The break-even point is (12,500,1,750,000). (12,500,1,750,000).

#### Analysis

This means if the company sells 12,500 helmets, they break even; both the sales and cost incurred equaled 1.75 million dollars. See [Figure 23](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_025>)

![Graph of the two functions, C\(x\) and R\(x\) where it shows that below \(12500, 1750000\) the company loses money and above that point the company makes a profit.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0212d4cb57fc601a62b77ed6d6fee5ceaf8451f5) Figure  23

###  Media

Access these online resources for additional instruction and practice with graphs of linear functions.

  * [Finding Input of Function from the Output and Graph](<http://openstax.org/l/findinginput>)
  * [Graphing Functions using Tables](<http://openstax.org/l/graphwithtable>)

###  2.2 Section Exercises

#### Verbal

[1](<chapter-2>). 

If the graphs of two linear functions are parallel, describe the relationship between the slopes and the _y_ -intercepts.

2. 

If the graphs of two linear functions are perpendicular, describe the relationship between the slopes and the _y_ -intercepts.

[3](<chapter-2>). 

If a horizontal line has the equation f(x)=af(x)=a and a vertical line has the equation x=a,x=a, what is the point of intersection? Explain why what you found is the point of intersection.

4. 

Explain how to find a line parallel to a linear function that passes through a given point.

[5](<chapter-2>). 

Explain how to find a line perpendicular to a linear function that passes through a given point.

#### Algebraic

For the following exercises, determine whether the lines given by the equations below are parallel, perpendicular, or neither parallel nor perpendicular:

6. 

4x−7y=10 7x+4y=1 4x−7y=10 7x+4y=1

[7](<chapter-2>). 

3y+x=12 −y=8x+1 3y+x=12 −y=8x+1

8. 

3y+4x=12 −6y=8x+1 3y+4x=12 −6y=8x+1

[9](<chapter-2>). 

6x−9y=10 3x+2y=1 6x−9y=10 3x+2y=1

10. 

y= 2 3 x+1 3x+2y=1 y= 2 3 x+1 3x+2y=1

[11](<chapter-2>). 

y= 3 4 x+1 −3x+4y=1 y= 3 4 x+1 −3x+4y=1

For the following exercises, find the _x_ \- and _y-_ intercepts of each equation

12. 

f( x )=−x+2 f( x )=−x+2

[13](<chapter-2>). 

g(x)=2x+4g(x)=2x+4

14. 

h( x )=3x−5 h( x )=3x−5

[15](<chapter-2>). 

k( x )=−5x+1 k( x )=−5x+1

16. 

−2x+5y=20 −2x+5y=20

[17](<chapter-2>). 

7x+2y=56 7x+2y=56

For the following exercises, use the descriptions of each pair of lines given below to find the slopes of Line 1 and Line 2. Is each pair of lines parallel, perpendicular, or neither?

18. 

  * Line 1: Passes through (0,6)(0,6) and (3,−24)(3,−24)
  * Line 2: Passes through (−1,19)(−1,19) and (8,−71)(8,−71)

[19](<chapter-2>). 

  * Line 1: Passes through (−8,−55)(−8,−55) and (10,89)(10,89)
  * Line 2: Passes through (9,−44)(9,−44) and (4,−14)(4,−14)

20. 

  * Line 1: Passes through (2,3)(2,3) and (4,−1)(4,−1)
  * Line 2: Passes through (6,3)(6,3) and (8,5)(8,5)

[21](<chapter-2>). 

  * Line 1: Passes through (1,7)(1,7) and (5,5)(5,5)
  * Line 2: Passes through (−1,−3)(−1,−3) and (1,1)(1,1)

22. 

  * Line 1: Passes through (0,5)(0,5) and (3,3)(3,3)
  * Line 2: Passes through (1,−5)(1,−5) and (3,−2)(3,−2)

[23](<chapter-2>). 

  * Line 1: Passes through (2,5)(2,5) and (5,−1)(5,−1)
  * Line 2: Passes through (−3,7)(−3,7) and (3,−5)(3,−5)

24. 

Write an equation for a line parallel to f(x)=−5x−3f(x)=−5x−3 and passing through the point (2, –12).(2, –12).

[25](<chapter-2>). 

Write an equation for a line parallel to g(x)=3x−1g(x)=3x−1 and passing through the point (4,9).(4,9).

26. 

Write an equation for a line perpendicular to h(t)=−2t+4h(t)=−2t+4 and passing through the point (-4, –1).(-4, –1).

[27](<chapter-2>). 

Write an equation for a line perpendicular to p(t)=3t+4p(t)=3t+4 and passing through the point (3,1).(3,1).

28. 

Find the point at which the line f(x)=−2x−1f(x)=−2x−1 intersects the line g(x)=−x.g(x)=−x.

[29](<chapter-2>). 

Find the point at which the line f(x)=2x+5f(x)=2x+5 intersects the line g(x)=−3x−5.g(x)=−3x−5.

30. 

Use algebra to find the point at which the line f(x)=−45x+27425f(x)=−45x+27425 intersects the line h(x)=94x+7310.h(x)=94x+7310.

[31](<chapter-2>). 

Use algebra to find the point at which the line f(x)=74x+45760f(x)=74x+45760 intersects the line g(x)=43x+315.g(x)=43x+315.

#### Graphical

For the following exercises, match the given linear equation with its graph in [Figure 24](<2-2-graphs-of-linear-functions#CNX_Precalc_Figure_02_02_201>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a39e9ff4d84a7c0763a46ce587744ccb05e4d3c5) Figure  24

32. 

f( x )=−x−1 f( x )=−x−1

[33](<chapter-2>). 

f(x)=−2x−1f(x)=−2x−1

34. 

f(x)=−12x−1f(x)=−12x−1

[35](<chapter-2>). 

f(x)=2f(x)=2

36. 

f(x)=2+xf(x)=2+x

[37](<chapter-2>). 

f(x)=3x+2f(x)=3x+2

For the following exercises, sketch a line with the given features.

38. 

An _x_ -intercept of (–4, 0)(–4, 0) and _y_ -intercept of (0, –2)(0, –2)

[39](<chapter-2>). 

An _x_ -intercept of (–2, 0)(–2, 0) and _y_ -intercept of (0, 4)(0, 4)

40. 

A _y_ -intercept of (0, 7)(0, 7) and slope −32−32

[41](<chapter-2>). 

A _y_ -intercept of (0, 3)(0, 3) and slope 2525

42. 

Passing through the points (–6, –2)(–6, –2) and (6, –6)(6, –6)

[43](<chapter-2>). 

Passing through the points (–3, –4)(–3, –4) and  (3, 0) (3, 0)

For the following exercises, sketch the graph of each equation.

44. 

f(x)=−2x−1f(x)=−2x−1

[45](<chapter-2>). 

g(x)=−3x+2g(x)=−3x+2

46. 

h(x)=13x+2h(x)=13x+2

[47](<chapter-2>). 

k(x)=23x−3k(x)=23x−3

48. 

f( t )=3+2t f( t )=3+2t

[49](<chapter-2>). 

p(t)=−2+3tp(t)=−2+3t

50. 

x=3x=3

[51](<chapter-2>). 

x=−2 x=−2

52. 

r(x)=4r(x)=4

[53](<chapter-2>). 

q(x)=3q(x)=3

54. 

4x=−9y+364x=−9y+36

[55](<chapter-2>). 

x3−y4=1x3−y4=1

56. 

3x−5y=153x−5y=15

[57](<chapter-2>). 

3x=153x=15

58. 

3y=123y=12

[59](<chapter-2>). 

If g(x)g(x) is the transformation of f(x)=xf(x)=x after a vertical compression by  3 4 , 3 4 , a shift right by 2, and a shift down by 4

  1. ⓐ Write an equation for g(x).g(x).
  2. ⓑ What is the slope of this line?
  3. ⓒ Find the _y-_ intercept of this line.

60. 

If g(x)g(x) is the transformation of f(x)=xf(x)=x after a vertical compression by 13,13, a shift left by 1, and a shift up by 3

  1. ⓐ Write an equation for g(x).g(x).
  2. ⓑ What is the slope of this line?
  3. ⓒ Find the _y-_ intercept of this line.

For the following exercises,, write the equation of the line shown in the graph.

[61](<chapter-2>). 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/33c38da1736b288b7f138eecf0d7998aacacd314)

62. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5871f0ae9e05bf660ad09386eaeaf534c6258481)

[63](<chapter-2>). 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/739ba6401964d68135f4f1bcb29d74066be1e991)

64. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/55091e58610407d19d57b76e71ed7d457b65cccc)

For the following exercises, find the point of intersection of each pair of lines if it exists. If it does not exist, indicate that there is no point of intersection.

[65](<chapter-2>). 

y= 3 4 x+1 −3x+4y=12 y= 3 4 x+1 −3x+4y=12

66. 

2x−3y=12 5y+x=30 2x−3y=12 5y+x=30

[67](<chapter-2>). 

2x=y−3y+4x=15 2x=y−3y+4x=15

68. 

x−2y+2=3 x−y=3 x−2y+2=3 x−y=3

[69](<chapter-2>). 

5x+3y=−65 x−y=−5 5x+3y=−65 x−y=−5

#### Extensions

70. 

Find the equation of the line parallel to the line g(x)=−0.01x+2.01g(x)=−0.01x+2.01 through the point (1, 2).(1, 2).

[71](<chapter-2>). 

Find the equation of the line perpendicular to the line g(x)=−0.01x+2.01g(x)=−0.01x+2.01 through the point (1, 2).(1, 2).

For the following exercises, use the functions f(x)=−0.1x+200 and g(x)=20x+0.1.f(x)=−0.1x+200 and g(x)=20x+0.1.

72. 

Find the point of intersection of the lines ff and g.g.

[73](<chapter-2>). 

Where is f(x)f(x) greater than g(x)?g(x)? Where is g(x)g(x) greater than f(x)?f(x)?

#### Real-World Applications

74. 

A car rental company offers two plans for renting a car. 

  * Plan A: $30 per day and $0.18 per mile
  * Plan B: $50 per day with free unlimited mileage

How many miles would you need to drive for plan B to save you money?

[75](<chapter-2>). 

A cell phone company offers two plans for minutes. 

  * Plan A: $20 per month and $1 for every one hundred texts.
  * Plan B: $50 per month with free unlimited texts.

How many texts would you need to send per month for plan B to save you money?

76. 

A cell phone company offers two plans for minutes. 

  * Plan A: $15 per month and $2 for every 300 texts.
  * Plan B: $25 per month and $0.50 for every 100 texts.

How many texts would you need to send per month for plan B to save you money?

