## jQuery.Scroolly, what is it?
Scroolly is a handy jQuery plugin that simplifies greatly scripting of scroll-effects.

## Scroll-effects, what are those?
Scroll-effects are some scripted scenarios that are attuned to web-page scrolling position or direction.
Below are some well known scroll-effects. There are no industry standards in this area so consider their titles as products of folklore or my imagination.

1. **Parallax** - the adjustment of object’s movement speed. Usually applied to background position and h1 placed on some photo background. (See ‘demo/1.parallax.html’)

2. **Back to top** - the behavior of ‘Back to top’ button that is hidden at the start and appears when user scrolls page a little. (See ‘demo/2.back-to-top.html’)

3. **Sticky** - titled after ‘position: sticky’ draft css specification. The behavior of an element that behaves like ‘position: static’ till it reaches the top border of a viewport. Then element sticks to the top viewport border till it’s bottom border touches it’s containing element bottom border. (See ‘demo/3.sticky.html’)

4. **Sticky reverse** or **reversed sticky** - The element behaves much like previous behavior but hides when user scrolls down (forward) and appears when user scrolls top (backward). (See ‘demo/4.sticky-reverse.html’)

5. **Progress bar** - set of scenarios based on the scrolling-progress. The most famous - is some progress bar that indicates the progress of article reading. Less obvious - measurement of user’s reading speed to assess ‘reading time’ and show it later. (See ‘demo/5.progressbar.html’)

6. **Accordion** - this scenario applies ‘stcicky’ effect to the title bars of sequenced post items. The most famous case - instagram feed. (See ‘demo/6.accordion.html’)

7. **Menu Spy** - well known ‘scroll spy’ effect in twitter bootstrap. The indication of current article item in navigation menu. (See ‘demo/7.menu-spy.html’)

8. **Staging** - the most sophisticated set of scrolling scenarios based on fixing some viewport sized block (‘stage’) and performing some animations with it’s habitats (‘actors’). (See ‘demo/staging-b.html’)

## Common Problems with Scroll-Effects
There several problems scripting scroll-effects. And they are:

1. Lots of factors and variables that should be considered. 
  * Document’s, viewport’s, element’s sizes and positions.
  * Scrolling direction.
  * Responsive design resize adaptations.

2. Computations itself. Their complexity increases exponentially with the number of effects.

3. Mobile devices. Javascript works slower on mobile devices and most of them including iOS devices block javascript during scrolls.

4. You never know what to «google». Since there are no standards, sometimes you don’t know how to call scroll-effect you are looking for.

##Guess what? jQuery.Scroolly is the salvation :) 
Scroolly provides you with simple syntax easy to understand learn and remember. The are almost no limitation except for mobile devices.

So what Scroolly scripting looks like? Here:
```
$('#element').scrolly([
	rule1,
	rule2,
	rule3
]);
```
What are those ‘rules’? Rules - are main building bricks of scroll effects. Lets look at the simple sample:
```
$('#element').scroolly({
	from: 'doc-top',
	to: 'doc-bottom',
	css: {
		color: 'red'
	}
});
```
Yep, you can omit array brackets if you have only one rule. Actually in Scroolly lots of stuff can be omitted and you’ll like it. 

But lets get back to our rule. Each rule is a javascript object that consists of some conditions and actions. 

> When conditions are met the actions are taken.

This very rule means that when viewport is between top document border and bottom document border (and it’s always true so you can omit ‘from’ and ‘to’) the #element gets the defined css styling.

## Rule syntax
Below is the full rule syntax sample:
```
{
	// conditions
	from: 'document-top',
	to: 'document-bottom',
	minWidth: 0,
	maxWidth: 'infinity',
	direction: 0,

	// actions - css
	css: {
		'color': 'white',
		'background-color': 'black'
	},
	cssFrom: {
		'border': '1px solid #000',
		'-border-radius': '10px 0px 10px 0px'
	},
	cssTo: {
		'border': '10px solid #FFFFFF',
		'-border-radius': '0px 10px 0px 10px'
	},
	addClass: 'cls1 cls2',
	removeClass: 'cls3',

	// actions - callbacks
	onScroll: function($element, offset, length, rule){},
	onCheckIn: function($element, rule){},
	onCheckOut: function($element, rule){},
	onTopIn: function($element, rule){},
	onTopOut: function($element, rule){},
	onBottomIn: function($element, rule){},
	onBottomOut: function($element, rule){},
	onDirectionChanged: function($element, direction, rule){},
}
```
