# 2.1 Linear Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/2-1-linear-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 2.1 Linear Functions

### Learning Objectives

In this section, you will:

  * Represent a linear function.
  * Determine whether a linear function is increasing, decreasing, or constant.
  * Calculate and interpret slope.
  * Write the point-slope form of an equation.
  * Write and interpret a linear function.

![Front view of a subway train, the maglev train.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5bea8e7bcd2ba8ccf51314ed4f9c669fd0791f3f) Figure  1 Shanghai MagLev Train (credit: “kanegen”/Flickr)

Just as with the growth of a bamboo plant, there are many situations that involve constant change over time. Consider, for example, the first commercial maglev train in the world, the Shanghai MagLev Train ([Figure 1](<2-1-linear-functions#CNX_Precalc_Figure_02_01_001>)). It carries passengers comfortably for a 30-kilometer trip from the airport to the subway station in only eight minutes.[2](<2-1-linear-functions#ch02mod01_fn01>)

Suppose a maglev train were to travel a long distance, and that the train maintains a constant speed of 83 meters per second for a period of time once it is 250 meters from the station. How can we analyze the train’s distance from the station as a function of time? In this section, we will investigate a kind of function that is useful for this purpose, and use it to investigate real-world situations such as the train’s distance from the station at a given point in time.

### Representing Linear Functions

The function describing the train’s motion is a **linear function** , which is defined as a function with a constant rate of change, that is, a polynomial of degree 1. There are several ways to represent a linear function, including word form, function notation, tabular form, and graphical form. We will describe the train’s motion as a function using each method.

#### Representing a Linear Function in Word Form

Let’s begin by describing the linear function in words. For the train problem we just considered, the following word sentence may be used to describe the function relationship.

  * _The train’s distance from the station is a function of the time during which the train moves at a constant speed plus its original distance from the station when it began moving at constant speed._

The speed is the rate of change. Recall that a rate of change is a measure of how quickly the dependent variable changes with respect to the independent variable. The rate of change for this example is constant, which means that it is the same for each input value. As the time (input) increases by 1 second, the corresponding distance (output) increases by 83 meters. The train began moving at this constant speed at a distance of 250 meters from the station.

#### Representing a Linear Function in Function Notation

Another approach to representing linear functions is by using function notation. One example of function notation is an equation written in the form known as the slope-intercept form of a line, where  x x is the input value,  m m is the rate of change, and  b b is the initial value of the dependent variable.

Equation form y=mx+b Equation notation f(x)=mx+b Equation form y=mx+b Equation notation f(x)=mx+b

In the example of the train, we might use the notation  D(t) D(t) in which the total distance  D D is a function of the time  t. t. The rate,  m, m, is 83 meters per second. The initial value of the dependent variable  b b is the original distance from the station, 250 meters. We can write a generalized equation to represent the motion of the train.

D(t)=83t+250 D(t)=83t+250

#### Representing a Linear Function in Tabular Form

A third method of representing a linear function is through the use of a table. The relationship between the distance from the station and the time is represented in [Figure 2](<2-1-linear-functions#CNX_Precalc_Figure_02_01_015>). From the table, we can see that the distance changes by 83 meters for every 1 second increase in time.

![Table with the first row, labeled t, containing the seconds from 0 to 3, and with the second row, labeled D\(t\), containing the meters 250 to 499. The first row goes up by 1 second, and the second row goes up by 83 meters.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6aecdf2ee376e4689530a890c868178264b2b088) Figure  2 Tabular representation of the function _D_ showing selected input and output values

###  Q&A

**Can the input in the previous example be any real number?**

_No. The input represents time, so while nonnegative rational and irrational numbers are possible, negative real numbers are not possible for this example. The input consists of non-negative real numbers._

#### Representing a Linear Function in Graphical Form

Another way to represent linear functions is visually, using a graph. We can use the function relationship from above,  D(t)=83t+250, D(t)=83t+250, to draw a graph, represented in [Figure 3](<2-1-linear-functions#CNX_Precalc_Figure_02_01_012>). Notice the graph is a line. When we plot a linear function, the graph is always a line.

The rate of change, which is constant, determines the slant, or **slope** of the line. The point at which the input value is zero is the vertical intercept, or **_y_ -intercept**, of the line. We can see from the graph in [Figure 3](<2-1-linear-functions#CNX_Precalc_Figure_02_01_012>) that the _y_ -intercept in the train example we just saw is  (0,250) (0,250) and represents the distance of the train from the station when it began moving at a constant speed.

![A graph of an increasing function with points at \(-2, -4\) and \(0, 2\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/06f1ce187e7cb04cd889750e6dee00e67358c499) Figure  3 The graph of  D(t)=83t+250. D(t)=83t+250. Graphs of linear functions are lines because the rate of change is constant.

Notice that the graph of the train example is restricted, but this is not always the case. Consider the graph of the line  f( x )=2 x +1. f( x )=2 x +1. Ask yourself what numbers can be input to the function, that is, what is the domain of the function? The domain is comprised of all real numbers because any number may be doubled, and then have one added to the product.

###  Linear Function

A linear function is a function whose graph is a line. Linear functions can be written in the slope-intercept form of a line

f(x)=mx+b f(x)=mx+b

where  b b is the initial or starting value of the function (when input,  x=0 x=0 ), and  m m is the constant rate of change, or slope of the function. The _y_ -intercept is at  (0,b). (0,b).

###  Example  1

#### Using a Linear Function to Find the Pressure on a Diver

The pressure,  P, P, in pounds per square inch (PSI) on the diver in [Figure 4](<2-1-linear-functions#CNX_Precalc_Figure_02_01_003>) depends upon her depth below the water surface,  d, d, in feet. This relationship may be modeled by the equation,  P(d)=0.434d+14.696. P(d)=0.434d+14.696. Restate this function in words.

![Scuba diver.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3e4969831c395eef7f5f504656b5f789da9ea60c) Figure  4 (credit: Ilse Reijs and Jan-Noud Hutten)

####  Solution

To restate the function in words, we need to describe each part of the equation. The pressure as a function of depth equals four hundred thirty-four thousandths times depth plus fourteen and six hundred ninety-six thousandths.

#### Analysis

The initial value, 14.696, is the pressure in PSI on the diver at a depth of 0 feet, which is the surface of the water. The rate of change, or slope, is 0.434 PSI per foot. This tells us that the pressure on the diver increases 0.434 PSI for each foot her depth increases.

### Determining whether a Linear Function Is Increasing, Decreasing, or Constant

The linear functions we used in the two previous examples increased over time, but not every linear function does. A linear function may be increasing, decreasing, or constant. For an increasing function, as with the train example, the output values increase as the input values increase. The graph of an increasing function has a positive slope. A line with a positive slope slants upward from left to right as in [Figure 5](<2-1-linear-functions#CNX_Precalc_Figure_02_01_004abc>)**(a)**. For a decreasing function, the slope is negative. The output values decrease as the input values increase. A line with a negative slope slants downward from left to right as in [Figure 5](<2-1-linear-functions#CNX_Precalc_Figure_02_01_004abc>)**(b)**. If the function is constant, the output values are the same for all input values so the slope is zero. A line with a slope of zero is horizontal as in [Figure 5](<2-1-linear-functions#CNX_Precalc_Figure_02_01_004abc>)**(c)**.

![Three graphs depicting an increasing function, a decreasing function, and a constant function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e59a52b09f18e19f8ec79d1bcc9546ced1c2fb0f) Figure  5

###  Increasing and Decreasing Functions

The slope determines if the function is an increasing linear function, a decreasing linear function, or a constant function.

  * f(x)=mx+b is an increasing function if m>0. f(x)=mx+b is an increasing function if m>0.
  * f(x)=mx+b is an decreasing function if m<0. f(x)=mx+b is an decreasing function if m<0.
  * f(x)=mx+b is a constant function if m=0. f(x)=mx+b is a constant function if m=0.

###  Example  2

#### Deciding whether a Function Is Increasing, Decreasing, or Constant

Some recent studies suggest that a teenager sends an average of 60 texts per day.[3](<2-1-linear-functions#ch02mod01_fn02>) For each of the following scenarios, find the linear function that describes the relationship between the input value and the output value. Then, determine whether the graph of the function is increasing, decreasing, or constant.

  1. ⓐ The total number of texts a teen sends is considered a function of time in days. The input is the number of days, and output is the total number of texts sent.
  2. ⓑ A teen has a limit of 500 texts per month in his or her data plan. The input is the number of days, and output is the total number of texts remaining for the month.
  3. ⓒ A teen has an unlimited number of texts in his or her data plan for a cost of $50 per month. The input is the number of days, and output is the total cost of texting each month.

####  Solution

Analyze each function.

  1. ⓐ The function can be represented as  f(x)=60x f(x)=60x where  x x is the number of days. The slope, 60, is positive so the function is increasing. This makes sense because the total number of texts increases with each day.
  2. ⓑ The function can be represented as  f(x)=500−60x f(x)=500−60x where  x x is the number of days. In this case, the slope is negative so the function is decreasing. This makes sense because the number of texts remaining decreases each day and this function represents the number of texts remaining in the data plan after  x x days.
  3. ⓒ The cost function can be represented as  f(x)=50 f(x)=50 because the number of days does not affect the total cost. The slope is 0 so the function is constant.

### Calculating and Interpreting Slope

In the examples we have seen so far, we have had the slope provided for us. However, we often need to calculate the slope given input and output values. Given two values for the input,  x 1 x 1 and  x 2 , x 2 , and two corresponding values for the output,  y 1 y 1 and  y 2 y 2 —which can be represented by a set of points,  ( x 1 ,  y 1 ) ( x 1 ,  y 1 ) and  ( x 2 ,  y 2 ) ( x 2 ,  y 2 ) —we can calculate the slope  m, m, as follows

m= change in output (rise) change in input (run) = Δy Δx = y 2 − y 1 x 2 − x 1 m= change in output (rise) change in input (run) = Δy Δx = y 2 − y 1 x 2 − x 1

where Δy Δy is the vertical displacement and  Δx Δx is the horizontal displacement. Note in function notation two corresponding values for the output y1 y1 and y2y2 for the function  f, f, y1=f(x1)y1=f(x1) and y2=f(x2),y2=f(x2), so we could equivalently write

m= f( x 2 )–f( x 1 ) x 2 – x 1 m= f( x 2 )–f( x 1 ) x 2 – x 1

[Figure 6](<2-1-linear-functions#CNX_Precalc_Figure_02_01_005>) indicates how the slope of the line between the points,  ( x 1, y 1 ) ( x 1, y 1 ) and  ( x 2, y 2 ), ( x 2, y 2 ), is calculated. Recall that the slope measures steepness. The greater the absolute value of the slope, the steeper the line is.

![Graph depicting how to calculate the slope of a line](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a7a1ae5e34e68a9d992a37fbbb5977f7974b528d) Figure  6 The slope of a function is calculated by the change in  y y divided by the change in  x. x. It does not matter which coordinate is used as the  ( x 2, y 2 ) ( x 2, y 2 ) and which is the  ( x 1 , y 1 ), ( x 1 , y 1 ), as long as each calculation is started with the elements from the same coordinate pair.

###  Q&A

**Are the units for slope always units for the output units for the input units for the output units for the input ?**

_Yes. Think of the units as the change of output value for each unit of change in input value. An example of slope could be miles per hour or dollars per day. Notice the units appear as a ratio of units for the output per units for the input._

###  Calculate Slope

The slope, or rate of change, of a function mm can be calculated according to the following:

m= change in output (rise) change in input (run) = Δy Δx = y 2 − y 1 x 2 − x 1 m= change in output (rise) change in input (run) = Δy Δx = y 2 − y 1 x 2 − x 1

where  x 1 x 1 and  x 2 x 2 are input values,  y 1 y 1 and  y 2 y 2 are output values.

###  How To

**Given two points from a linear function, calculate and interpret the slope.**

  1. Determine the units for output and input values.
  2. Calculate the change of output values and change of input values.
  3. Interpret the slope as the change in output values per unit of the input value.

###  Example  3

#### Finding the Slope of a Linear Function

If  f(x) f(x) is a linear function, and  ( 3,−2 ) ( 3,−2 ) and  ( 8,1 ) ( 8,1 ) are points on the line, find the slope. Is this function increasing or decreasing?

####  Solution

The coordinate pairs are  ( 3,−2 ) ( 3,−2 ) and  ( 8,1 ). ( 8,1 ). To find the rate of change, we divide the change in output by the change in input.

m= change in output change in input = 1−(−2) 8−3 = 3 5 m= change in output change in input = 1−(−2) 8−3 = 3 5

We could also write the slope as  m=0.6. m=0.6. The function is increasing because  m>0. m>0.

#### Analysis

As noted earlier, the order in which we write the points does not matter when we compute the slope of the line as long as the first output value, or _y_ -coordinate, used corresponds with the first input value, or _x_ -coordinate, used.

###  Try It  #1

If  f(x) f(x) is a linear function, and  ( 2,3 ) ( 2,3 ) and  ( 0,4 ) ( 0,4 ) are points on the line, find the slope. Is this function increasing or decreasing?

###  Example  4

#### Finding the Population Change from a Linear Function

The population of a city increased from 23,400 to 27,800 between 2008 and 2012. Find the change of population per year if we assume the change was constant from 2008 to 2012.

####  Solution

The rate of change relates the change in population to the change in time. The population increased by 27,800−23,400=4,400 27,800−23,400=4,400 people over the four-year time interval. To find the rate of change, divide the change in the number of people by the number of years.

4,400 people 4 years =1,100 people year 4,400 people 4 years =1,100 people year

So the population increased by 1,100 people per year.

#### Analysis

Because we are told that the population increased, we would expect the slope to be positive. This positive slope we calculated is therefore reasonable.

###  Try It  #2

The population of a small town increased from 1,442 to 1,868 between 2009 and 2012. Find the change of population per year if we assume the change was constant from 2009 to 2012.

### Writing the Point-Slope Form of a Linear Equation

Up until now, we have been using the slope-intercept form of a linear equation to describe linear functions. Here, we will learn another way to write a linear function, the point-slope form.

y− y 1 =m( x− x 1 ) y− y 1 =m( x− x 1 )

The point-slope form is derived from the slope formula.

m= y− y 1 x− x 1 assuming x≠ x 1 m( x− x 1 )= y− y 1 x− x 1 ( x− x 1 ) Multiply both sides by ( x− x 1 ). m( x− x 1 )=y− y 1 Simplify. y− y 1 =m( x− x 1 ) Rearrange. m= y− y 1 x− x 1 assuming x≠ x 1 m( x− x 1 )= y− y 1 x− x 1 ( x− x 1 ) Multiply both sides by ( x− x 1 ). m( x− x 1 )=y− y 1 Simplify. y− y 1 =m( x− x 1 ) Rearrange.

Keep in mind that the slope-intercept form and the point-slope form can be used to describe the same function. We can move from one form to another using basic algebra. For example, suppose we are given an equation in point-slope form,  y−4=− 1 2 ( x−6 ) y−4=− 1 2 ( x−6 ) . We can convert it to the slope-intercept form as shown.

y−4=− 1 2 (x−6) y−4=− 1 2 x+3 Distribute the − 1 2 . y=− 1 2 x+7 Add 4 to each side. y−4=− 1 2 (x−6) y−4=− 1 2 x+3 Distribute the − 1 2 . y=− 1 2 x+7 Add 4 to each side.

Therefore, the same line can be described in slope-intercept form as  y=− 1 2 x+7. y=− 1 2 x+7.

###  Point-Slope Form of a Linear Equation

The **point-slope form** of a linear equation takes the form

y− y 1 =m( x− x 1 ) y− y 1 =m( x− x 1 )

where  m m is the slope,  x 1 and y 1 x 1 and y 1 are the  x- and y- x- and y- coordinates of a specific point through which the line passes.

#### Writing the Equation of a Line Using a Point and the Slope

The point-slope form is particularly useful if we know one point and the slope of a line. Suppose, for example, we are told that a line has a slope of 2 and passes through the point  ( 4,1 ). ( 4,1 ). We know that  m=2 m=2 and that  x 1 =4 x 1 =4 and  y 1 =1. y 1 =1. We can substitute these values into the general point-slope equation.

y− y 1 =m( x− x 1 ) y−1=2( x−4 ) y− y 1 =m( x− x 1 ) y−1=2( x−4 )

If we wanted to then rewrite the equation in slope-intercept form, we apply algebraic techniques.

y−1=2(x−4) y−1=2x−8 Distribute the 2. y=2x−7 Add 1 to each side. y−1=2(x−4) y−1=2x−8 Distribute the 2. y=2x−7 Add 1 to each side.

Both equations,  y−1=2( x−4 ) y−1=2( x−4 ) and  y=2x–7, y=2x–7, describe the same line. See [Figure 7](<2-1-linear-functions#CNX_Precalc_Figure_02_01_013>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6f64c2945ae3e3da15f07c27a1cf35448b9e94a9) Figure  7

###  Example  5

#### Writing Linear Equations Using a Point and the Slope

Write the point-slope form of an equation of a line with a slope of 3 that passes through the point  ( 6,–1 ). ( 6,–1 ). Then rewrite it in the slope-intercept form.

####  Solution

Let’s figure out what we know from the given information. The slope is 3, so m=3.m=3. We also know one point, so we know x1=6x1=6 and y1 =−1. y1 =−1. Now we can substitute these values into the general point-slope equation.

y− y 1 =m(x− x 1 ) y−(−1)=3(x−6) Substitute known values. y+1=3(x−6) Distribute −1 to find point-slope form. y− y 1 =m(x− x 1 ) y−(−1)=3(x−6) Substitute known values. y+1=3(x−6) Distribute −1 to find point-slope form.

Then we use algebra to find the slope-intercept form.

y+1=3(x−6) y+1=3x−18 Distribute 3. y=3x−19 Simplify to slope-intercept form. y+1=3(x−6) y+1=3x−18 Distribute 3. y=3x−19 Simplify to slope-intercept form.

###  Try It  #3

Write the point-slope form of an equation of a line with a slope of  –2 –2 that passes through the point  ( –2,2 ). ( –2,2 ). Then rewrite it in the slope-intercept form.

#### Writing the Equation of a Line Using Two Points 

The point-slope form of an equation is also useful if we know any two points through which a line passes. Suppose, for example, we know that a line passes through the points  ( 0,1 ) ( 0,1 ) and  ( 3,2 ). ( 3,2 ). We can use the coordinates of the two points to find the slope.

m= y 2 − y 1 x 2 − x 1 = 2−1 3−0 = 1 3 m= y 2 − y 1 x 2 − x 1 = 2−1 3−0 = 1 3

Now we can use the slope we found and the coordinates of one of the points to find the equation for the line. Let use (0, 1) for our point.

y− y 1 =m( x− x 1 ) y−1= 1 3 ( x−0 ) y− y 1 =m( x− x 1 ) y−1= 1 3 ( x−0 )

As before, we can use algebra to rewrite the equation in the slope-intercept form.

y−1= 1 3 (x−0) y−1= 1 3 x Distribute the  1 3 . y= 1 3 x+1 Add 1 to each side. y−1= 1 3 (x−0) y−1= 1 3 x Distribute the  1 3 . y= 1 3 x+1 Add 1 to each side.

Both equations describe the line shown in [Figure 8](<2-1-linear-functions#CNX_Precalc_Figure_02_01_014>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d75b8518bef9b8caa52117fc14244620b0cc3869) Figure  8

###  Example  6

#### Writing Linear Equations Using Two Points

Write the point-slope form of an equation of a line that passes through the points (5, 1) and (8, 7). Then rewrite it in the slope-intercept form.

####  Solution

Let’s begin by finding the slope.

m= y 2 − y 1 x 2 − x 1 = 7−1 8−5 = 6 3 =2 m= y 2 − y 1 x 2 − x 1 = 7−1 8−5 = 6 3 =2

So  m=2. m=2. Next, we substitute the slope and the coordinates for one of the points into the general point-slope equation. We can choose either point, but we will use  (5,1). (5,1).

y− y 1 =m( x− x 1 ) y−1=2( x−5 ) y− y 1 =m( x− x 1 ) y−1=2( x−5 )

The point-slope equation of the line is  y 2 –1=2( x 2 –5). y 2 –1=2( x 2 –5). To rewrite the equation in slope-intercept form, we use algebra.

y−1=2(x−5) y−1=2x−10 y=2x−9 y−1=2(x−5) y−1=2x−10 y=2x−9

The slope-intercept equation of the line is  y=2x–9. y=2x–9.

###  Try It  #4

Write the point-slope form of an equation of a line that passes through the points  (–1,3) (–1,3) and  (0,0). (0,0). Then rewrite it in the slope-intercept form.

### Writing and Interpreting an Equation for a Linear Function

Now that we have written equations for linear functions in both the slope-intercept form and the point-slope form, we can choose which method to use based on the information we are given. That information may be provided in the form of a graph, a point and a slope, two points, and so on. Look at the graph of the function  ff in [Figure 9](<2-1-linear-functions#CNX_Precalc_Figure_02_01_006>).

![Graph depicting how to calculate the slope of a line](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ad267d8ce45e7410c4a1abb402789284ed15ea9c) Figure  9

We are not given the slope of the line, but we can choose any two points on the line to find the slope. Let’s choose  ( 0,7 ) ( 0,7 ) and  ( 4,4 ). ( 4,4 ). We can use these points to calculate the slope.

m= y 2 − y 1 x 2 − x 1 = 4−7 4−0 =− 3 4 m= y 2 − y 1 x 2 − x 1 = 4−7 4−0 =− 3 4

Now we can substitute the slope and the coordinates of one of the points into the point-slope form.

y− y 1 =m(x− x 1 ) y−4=− 3 4 (x−4) y− y 1 =m(x− x 1 ) y−4=− 3 4 (x−4)

If we want to rewrite the equation in the slope-intercept form, we would find

y−4=− 3 4 (x−4) y−4=− 3 4 x+3 y=− 3 4 x+7 y−4=− 3 4 (x−4) y−4=− 3 4 x+3 y=− 3 4 x+7

If we wanted to find the slope-intercept form without first writing the point-slope form, we could have recognized that the line crosses the _y_ -axis when the output value is 7. Therefore, b=7.b=7. We now have the initial value bb and the slope mm so we can substitute mm and bb into the slope-intercept form of a line.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d0721a58dc75094ba9ea4cf8d804d63dbb9cf6fc)

So the function is  f(x)=− 3 4 x+7, f(x)=− 3 4 x+7, and the linear equation would be  y=− 3 4 x+7. y=− 3 4 x+7.

###  How To

**Given the graph of a linear function, write an equation to represent the function.**

  1. Identify two points on the line.
  2. Use the two points to calculate the slope.
  3. Determine where the line crosses the _y_ -axis to identify the _y_ -intercept by visual inspection.
  4. Substitute the slope and _y_ -intercept into the slope-intercept form of a line equation.

###  Example  7

#### Writing an Equation for a Linear Function

Write an equation for a linear function given a graph of  ff shown in [Figure 10](<2-1-linear-functions#CNX_Precalc_Figure_02_01_008a>).

![Graph of an increasing function with points at \(-3, 0\) and \(0, 1\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/903e1ea392429e5544bbc558c913d95f8a5cea16) Figure  10

####  Solution

Identify two points on the line, such as ( 0,2)( 0,2) and (−2,−4).(−2,−4). Use the points to calculate the slope.

m= y 2 − y 1 x 2 − x 1 = −4−2 −2−0 = −6 −2 =3 m= y 2 − y 1 x 2 − x 1 = −4−2 −2−0 = −6 −2 =3

Substitute the slope and the coordinates of one of the points into the point-slope form.

y− y 1 =m( x− x 1 ) y−( −4 )=3( x−( −2 ) ) y+4=3( x+2 ) y− y 1 =m( x− x 1 ) y−( −4 )=3( x−( −2 ) ) y+4=3( x+2 )

We can use algebra to rewrite the equation in the slope-intercept form.

y+4=3(x+2) y+4=3x+6 y=3x+2 y+4=3(x+2) y+4=3x+6 y=3x+2

#### Analysis

This makes sense because we can see from [Figure 11](<2-1-linear-functions#CNX_Precalc_Figure_02_01_008b>) that the line crosses the y-axis at the point ( 0,2)( 0,2), which is the _y_ -intercept, so b=2.b=2.

![Graph of an increasing line with points at \(0, 2\) and \(-2, -4\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e2c187415a52fd4e46129788325a6c3266b9fafe) Figure  11

###  Example  8

#### Writing an Equation for a Linear Cost Function

Suppose Ben starts a company in which he incurs a fixed cost of $1,250 per month for the overhead, which includes his office rent. His production costs are $37.50 per item. Write a linear function CC where C(x)C(x) is the cost for xx items produced in a given month.

####  Solution

The fixed cost is present every month, $1,250. The costs that can vary include the cost to produce each item, which is $37.50 for Ben. The variable cost, called the marginal cost, is represented by 37.5.37.5. The cost Ben incurs is the sum of these two costs, represented by  C( x )=1250+37.5x. C( x )=1250+37.5x.

#### Analysis 

If Ben produces 100 items in a month, his monthly cost is represented by

C(100)=1250+37.5(100) =5000 C(100)=1250+37.5(100) =5000

So his monthly cost would be $5,000.

###  Example  9

#### Writing an Equation for a Linear Function Given Two Points

If ff is a linear function, with f(3)=−2f(3)=−2, and f(8)=1f(8)=1, find an equation for the function in slope-intercept form.

####  Solution

We can write the given points using coordinates. 

f(3)=−2→(3,−2) f(8)=1→(8,1) f(3)=−2→(3,−2) f(8)=1→(8,1)

We can then use the points to calculate the slope.

m= y 2 − y 1 x 2 − x 1 = 1−(−2) 8−3 = 3 5 m= y 2 − y 1 x 2 − x 1 = 1−(−2) 8−3 = 3 5

Substitute the slope and the coordinates of one of the points into the point-slope form.

y− y 1 =m(x− x 1 ) y−(−2)= 3 5 (x−3) y− y 1 =m(x− x 1 ) y−(−2)= 3 5 (x−3)

We can use algebra to rewrite the equation in the slope-intercept form.

y+2= 3 5 (x−3) y+2= 3 5 x− 9 5 y= 3 5 x− 19 5 y+2= 3 5 (x−3) y+2= 3 5 x− 9 5 y= 3 5 x− 19 5

###  Try It  #5

If f(x)f(x) is a linear function, with  f(2)=–11,f(2)=–11, and f(4)=−25,f(4)=−25, find an equation for the function in slope-intercept form.

### Modeling Real-World Problems with Linear Functions

In the real world, problems are not always explicitly stated in terms of a function or represented with a graph. Fortunately, we can analyze the problem by first representing it as a linear function and then interpreting the components of the function. As long as we know, or can figure out, the initial value and the rate of change of a linear function, we can solve many different kinds of real-world problems.

###  How To

**Given a linear function ff and the initial value and rate of change, evaluate f(c).f(c). **

  1. Determine the initial value and the rate of change (slope).
  2. Substitute the values into f(x)=mx+b.f(x)=mx+b.
  3. Evaluate the function at x=c.x=c.

###  Example  10

#### Using a Linear Function to Determine the Number of Songs in a Music Collection

Marcus currently has 200 songs in his music collection. Every month, he adds 15 new songs. Write a formula for the number of songs,  N, N, in his collection as a function of time, t,t, the number of months. How many songs will he own in a year?

####  Solution

The initial value for this function is 200 because he currently owns 200 songs, so N(0)=200,N(0)=200, which means that b=200.b=200.

The number of songs increases by 15 songs per month, so the rate of change is 15 songs per month. Therefore we know that m=15.m=15. We can substitute the initial value and the rate of change into the slope-intercept form of a line.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e4a4f9d40b820d797a4f2a1cd27890d103aa5095)

We can write the formula N(t)=15t+200.N(t)=15t+200.

With this formula, we can then predict how many songs Marcus will have in 1 year (12 months). In other words, we can evaluate the function at t=12.t=12.

N(12)=15(12)+200 =180+200 =380 N(12)=15(12)+200 =180+200 =380

Marcus will have 380 songs in 12 months.

#### Analysis 

Notice that _N_ is an increasing linear function. As the input (the number of months) increases, the output (number of songs) increases as well.

###  Example  11

#### Using a Linear Function to Calculate Salary Plus Commission

Working as an insurance salesperson, Ilya earns a base salary plus a commission on each new policy. Therefore, Ilya’s weekly income, I,I, depends on the number of new policies, n,n, he sells during the week. Last week he sold 3 new policies, and earned $760 for the week. The week before, he sold 5 new policies and earned $920. Find an equation for I(n),I(n), and interpret the meaning of the components of the equation.

####  Solution

The given information gives us two input-output pairs: (3,760)(3,760) and (5,920).(5,920). We start by finding the rate of change.

m= 920−760 5−3 = $160 2 policies =$80 per policy m= 920−760 5−3 = $160 2 policies =$80 per policy

Keeping track of units can help us interpret this quantity. Income increased by $160 when the number of policies increased by 2, so the rate of change is $80 per policy. Therefore, Ilya earns a commission of $80 for each policy sold during the week.

We can then solve for the initial value.

I(n)=80n+b 760=80(3)+b when n=3,I(3)=760 760−80(3)=b 520=b I(n)=80n+b 760=80(3)+b when n=3,I(3)=760 760−80(3)=b 520=b

The value of bb is the starting value for the function and represents Ilya’s income when n=0,n=0, or when no new policies are sold. We can interpret this as Ilya’s base salary for the week, which does not depend upon the number of policies sold.

We can now write the final equation.

I(n)=80n+520 I(n)=80n+520

Our final interpretation is that Ilya’s base salary is $520 per week and he earns an additional $80 commission for each policy sold.

###  Example  12

#### Using Tabular Form to Write an Equation for a Linear Function

[Table 1](<2-1-linear-functions#Table_02_01_02>) relates the number of rats in a population to time, in weeks. Use the table to write a linear equation.

**_w_ , number of weeks** | 0 | 2 | 4 | 6  
---|---|---|---|---  
**_P(w)_ , number of rats** | 1000 | 1080 | 1160 | 1240  
  
Table  1

####  Solution

We can see from the table that the initial value for the number of rats is 1000, so b=1000.b=1000.

Rather than solving for m,m, we can tell from looking at the table that the population increases by 80 for every 2 weeks that pass. This means that the rate of change is 80 rats per 2 weeks, which can be simplified to 40 rats per week.

P(w)=40w+1000 P(w)=40w+1000

If we did not notice the rate of change from the table we could still solve for the slope using any two points from the table. For example, using (2,1080)(2,1080) and (6,1240)(6,1240)

m= 1240−1080 6−2 = 160 4 =40 m= 1240−1080 6−2 = 160 4 =40

###  Q&A

**Is the initial value always provided in a table of values like[Table 1](<2-1-linear-functions#Table_02_01_02>)?**

_No. Sometimes the initial value is provided in a table of values, but sometimes it is not. If you see an input of 0, then the initial value would be the corresponding output. If the initial value is not provided because there is no value of input on the table equal to 0, find the slope, substitute one coordinate pair and the slope into f(x)=mx+b,f(x)=mx+b, and solve for b.b. _

###  Try It  #6

A new plant food was introduced to a young tree to test its effect on the height of the tree. [Table 2](<2-1-linear-functions#Table_02_01_03>) shows the height of the tree, in feet, xx months since the measurements began. Write a linear function, H(x),H(x), where xx is the number of months since the start of the experiment.

** x x ** | 0 | 2 | 4 | 8 | 12  
---|---|---|---|---|---  
** H(x) H(x) ** | 12.5 | 13.5 | 14.5 | 16.5 | 18.5  
  
Table  2

###  Media

Access this online resource for additional instruction and practice with linear functions.

  * [Linear Functions](<http://openstax.org/l/linearfunctions>)

###  2.1 Section Exercises

#### Verbal

[1](<chapter-2>). 

Terry is skiing down a steep hill. Terry's elevation, E(t),E(t), in feet after tt seconds is given by E(t)=3000−70t.E(t)=3000−70t. Write a complete sentence describing Terry’s starting elevation and how it is changing over time.

2. 

Maria is climbing a mountain. Maria's elevation, E(t),E(t), in feet after tt minutes is given by  E(t)=1200+40t. E(t)=1200+40t. Write a complete sentence describing Maria’s starting elevation and how it is changing over time.

[3](<chapter-2>). 

Jessica is walking home from a friend’s house. After 2 minutes she is 1.4 miles from home. Twelve minutes after leaving, she is 0.9 miles from home. What is her rate in miles per hour?

4. 

Sonya is currently 10 miles from home and is walking farther away at 2 miles per hour. Write an equation for her distance from home _t_ hours from now.

[5](<chapter-2>). 

A boat is 100 miles away from the marina, sailing directly toward it at 10 miles per hour. Write an equation for the distance of the boat from the marina after _t_ hours.

6. 

Timmy goes to the fair with $40. Each ride costs $2. How much money will he have left after riding nn rides?

#### Algebraic

For the following exercises, determine whether the equation of the curve can be written as a linear function.

[7](<chapter-2>). 

y= 1 4 x+6 y= 1 4 x+6

8. 

y=3x−5 y=3x−5

[9](<chapter-2>). 

y=3 x 2 −2 y=3 x 2 −2

10. 

3x+5y=15 3x+5y=15

[11](<chapter-2>). 

3 x 2 +5y=15 3 x 2 +5y=15

12. 

3x+5 y 2 =15 3x+5 y 2 =15

[13](<chapter-2>). 

−2 x 2 +3 y 2 =6 −2 x 2 +3 y 2 =6

14. 

− x−3 5 =2y − x−3 5 =2y

For the following exercises, determine whether each function is increasing or decreasing.

[15](<chapter-2>). 

f(x)=4x+3 f(x)=4x+3

16. 

g(x)=5x+6g(x)=5x+6

[17](<chapter-2>). 

a(x)=5−2xa(x)=5−2x

18. 

b(x)=8−3xb(x)=8−3x

[19](<chapter-2>). 

h(x)=−2x+4h(x)=−2x+4

20. 

k(x)=−4x+1k(x)=−4x+1

[21](<chapter-2>). 

j(x)=12x−3j(x)=12x−3

22. 

p(x)=14x−5p(x)=14x−5

[23](<chapter-2>). 

n(x)=−13x−2n(x)=−13x−2

24. 

m(x)=−38x+3m(x)=−38x+3

For the following exercises, find the slope of the line that passes through the two given points.

[25](<chapter-2>). 

(2,4)(2,4) and (4, 10)(4, 10)

26. 

(1, 5)(1, 5) and (4, 11)(4, 11)

[27](<chapter-2>). 

(−1,4) (−1,4) and  (5,2) (5,2)

28. 

(8,−2) (8,−2) and  (4,6) (4,6)

[29](<chapter-2>). 

(6,11)(6,11) and  (−4,3) (−4,3)

For the following exercises, given each set of information, find a linear equation satisfying the conditions, if possible.

30. 

f(−5)=−4, f(−5)=−4, and  f(5)=2 f(5)=2

[31](<chapter-2>). 

f(−1)=4 f(−1)=4 and  f(5)=1 f(5)=1

32. 

(2,4) (2,4) and  (4,10) (4,10)

[33](<chapter-2>). 

Passes through  (1,5) (1,5) and  (4,11) (4,11)

34. 

Passes through (−1, 4)(−1, 4) and (5, 2)(5, 2)

[35](<chapter-2>). 

Passes through (−2, 8)(−2, 8) and (4, 6)(4, 6)

36. 

_x_ intercept at (−2, 0)(−2, 0) and _y_ intercept at  (0,−3) (0,−3)

[37](<chapter-2>). 

_x_ intercept at (−5, 0)(−5, 0) and _y_ intercept at (0, 4)(0, 4)

#### Graphical

For the following exercises, find the slope of the lines graphed.

38. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/718052107c2929bcc0aed2e06468f3e9710e4f9d)

[39](<chapter-2>). 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/314bc5427df9716bfded645e1e146a768729055d)

40. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9ba54599bff5a4cbcfa121ec3c2ef7aaddcf91fa)

For the following exercises, write an equation for the lines graphed.

[41](<chapter-2>). 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2fc293527c86418c3fd6a4ce76b73b5c954af98e)

42. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cf9d4657b9bf54d6740c48082f676a6f72d8f11a)

[43](<chapter-2>). 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/43f51b907fac9f94531a603d45e8bbd96e8c943e)

44. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5f32f29c37f258baa8cfef9f17474169fbb843ec)

[45](<chapter-2>). 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ffd39bfc54ba380f930aaf482de0d387d39d97a7)

46. 

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0a01dcdb4a13addb12b90c6cb95668d1b165728b)

#### Numeric

For the following exercises, which of the tables could represent a linear function? For each that could be linear, find a linear equation that models the data.

[47](<chapter-2>). 

** xx ** | 0 | 5 | 10 | 15  
---|---|---|---|---  
** g(x)g(x) ** | 5 | –10 | –25 | –40  
  
48. 

** xx ** | 0 | 5 | 10 | 15  
---|---|---|---|---  
** h(x)h(x) ** | 5 | 30 | 105 | 230  
  
[49](<chapter-2>). 

** xx ** | 0 | 5 | 10 | 15  
---|---|---|---|---  
** f(x)f(x) ** | –5 | 20 | 45 | 70  
  
50. 

** xx ** | 5 | 10 | 20 | 25  
---|---|---|---|---  
** k(x)k(x) ** | 13 | 28 | 58 | 73  
  
[51](<chapter-2>). 

** xx ** | 0 | 2 | 4 | 6  
---|---|---|---|---  
** g(x)g(x) ** | 6 | –19 | –44 | –69  
  
52. 

** xx ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x)f(x) ** | –4 | 16 | 36 | 56  
  
[53](<chapter-2>). 

** xx ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x)f(x) ** | –4 | 16 | 36 | 56  
  
54. 

** xx ** | 0 | 2 | 6 | 8  
---|---|---|---|---  
** k(x)k(x) ** | 6 | 31 | 106 | 231  
  
#### Technology

[55](<chapter-2>). 

If ff is a linear function, f(0.1)=11.5, andf(0.4)=–5.9,f(0.1)=11.5, andf(0.4)=–5.9, find an equation for the function.

56. 

Graph the function ff on a domain of [ –10,10 ]:f(x)=0.02x−0.01.[ –10,10 ]:f(x)=0.02x−0.01. Enter the function in a graphing utility. For the viewing window, set the minimum value of xx to be −10−10 and the maximum value of xx to be 10.10.

[57](<chapter-2>). 

Graph the function ff on a domain of [ –10,10 ]:fx)=2,500x+4,000[ –10,10 ]:fx)=2,500x+4,000

58. 

[Table 3](<2-1-linear-functions#Table_02_01_12>) shows the input, w, w,  and output, k,k, for a linear function k.k. a. Fill in the missing values of the table. b. Write the linear function k,k, round to 3 decimal places.

** w w ** | –10 | 5.5 | 67.5 | b  
---|---|---|---|---  
** k k ** | 30 | –26 | a | –44  
  
Table  3

[59](<chapter-2>). 

[Table 4](<2-1-linear-functions#Table_02_01_13>) shows the input, p,p, and output, q,q, for a linear function q.q. a. Fill in the missing values of the table. b. Write the linear function k.k.

** p p ** | 0.5 | 0.8 | 12 | b  
---|---|---|---|---  
** q q ** | 400 | 700 | a | 1,000,000  
  
Table  4

60. 

Graph the linear function ff on a domain of [ −10,10 ][ −10,10 ] for the function whose slope is 1818 and _y_ -intercept is 31163116. Label the points for the input values of −10−10 and 10.10.

[61](<chapter-2>). 

Graph the linear function ff on a domain of [ −0.1,0.1 ][ −0.1,0.1 ] for the function whose slope is 75 and _y_ -intercept is −22.5−22.5. Label the points for the input values of −0.1−0.1 and 0.1.0.1.

62. 

Graph the linear function ff where f(x)=ax+bf(x)=ax+b on the same set of axes on a domain of [ −4,4 ][ −4,4 ] for the following values of aa and b.b.

  1. a=2;b=3a=2;b=3
  2. a=2;​b=4a=2;​b=4
  3. a=2;b=–4a=2;b=–4
  4. a=2;b=–5 a=2;b=–5

#### Extensions

[63](<chapter-2>). 

Find the value of xx if a linear function goes through the following points and has the following slope: (x,2),(−4,6),m=3(x,2),(−4,6),m=3

64. 

Find the value of _y_ if a linear function goes through the following points and has the following slope: (10,y),(25,100),m=−5(10,y),(25,100),m=−5

[65](<chapter-2>). 

Find the equation of the line that passes through the following points: (a,b)(a,b) and ( a,b+1 ) ( a,b+1 )

66. 

Find the equation of the line that passes through the following points: (2a,b)(2a,b) and  (a,b+1)(a,b+1)

[67](<chapter-2>). 

Find the equation of the line that passes through the following points: (a,0)(a,0) and (c,d)(c,d)

#### Real-World Applications

68. 

At noon, a barista notices that she has $20 in her tip jar. If she makes an average of $0.50 from each customer, how much will she have in her tip jar if she serves nn more customers during her shift?

[69](<chapter-2>). 

A gym membership with two personal training sessions costs $125, while gym membership with five personal training sessions costs $260. What is cost per session?

70. 

A clothing business finds there is a linear relationship between the number of shirts, n,n, it can sell and the price, p,p, it can charge per shirt. In particular, historical data shows that 1,000 shirts can be sold at a price of $30$30, while 3,000 shirts can be sold at a price of $22. Find a linear equation in the form p(n)=mn+bp(n)=mn+b that gives the price pp they can charge for nn shirts.

[71](<chapter-2>). 

A phone company charges for service according to the formula: C(n)=24+0.1n,C(n)=24+0.1n, where nn is the number of minutes talked, and C(n)C(n) is the monthly charge, in dollars. Find and interpret the rate of change and initial value.

72. 

A farmer finds there is a linear relationship between the number of bean stalks, n,n, she plants and the yield, y,y, each plant produces. When she plants 30 stalks, each plant yields 30 oz of beans. When she plants 34 stalks, each plant produces 28 oz of beans. Find a linear relationship in the form y=mn+by=mn+b that gives the yield when nn stalks are planted.

[73](<chapter-2>). 

A city’s population in the year 1960 was 287,500. In 1989 the population was 275,900. Compute the rate of growth of the population and make a statement about the population rate of change in people per year.

74. 

A town’s population has been growing linearly. In 2003, the population was 45,000, and the population has been growing by 1,700 people each year. Write an equation, P(t),P(t), for the population tt years after 2003.

[75](<chapter-2>). 

Suppose that average annual income (in dollars) for the years 1990 through 1999 is given by the linear function: I(x)=1054x+23,286,I(x)=1054x+23,286, where xx is the number of years after 1990. Which of the following interprets the slope in the context of the problem?

  1. As of 1990, average annual income was $23,286.
  2. In the ten-year period from 1990–1999, average annual income increased by a total of $1,054.
  3. Each year in the decade of the 1990s, average annual income increased by $1,054.
  4. Average annual income rose to a level of $23,286 by the end of 1999.

76. 

When temperature is 0 degrees Celsius, the Fahrenheit temperature is 32. When the Celsius temperature is 100, the corresponding Fahrenheit temperature is 212. Express the Fahrenheit temperature as a linear function of C,C, the Celsius temperature, F(C).F(C).

  1. Find the rate of change of Fahrenheit temperature for each unit change temperature of Celsius.
  2. Find and interpret F(28).F(28).
  3. Find and interpret F(–40). F(–40).

### Footnotes

  * 2<http://www.chinahighlights.com/shanghai/transportation/maglev-train.htm>
  * 3<http://www.cbsnews.com/8301-501465_162-57400228-501465/teens-are-sending-60-texts-a-day-study-says/>

