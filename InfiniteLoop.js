const comp = React.Component;

const cards = ["card 1", "card 2", "card 3", "card 4", "card 5", "card 6", "card 7", "card 8"];

class App extends comp{

    constructor(props){
        super(props);
        this.renderCard = this.renderCard.bind(this);
        this.setCardSeparation = this.setCardSeparation.bind(this);
        this.animateCards = this.animateCards.bind(this);
        this.state = {separation:0, distance:0};
    }

    // method to set the card separation
    setCardSeparation(){
        const amount = this.props.cards.length;
        // cards wrap width
        const wrapWidth = this.refs.cardWrap.clientWidth;
        // separation calculation
        const separationCalc = Math.round( wrapWidth / (amount - 1) );
        // the real calculation depending on the result
        const separation = separationCalc > 165 ? separationCalc : 165;
        // update state
        this.setState({separation:separation, distance:(separation * amount)});
    }

    // method to animate the cards
    animateCards(e,i){

        let target = this.refs[e];

        // initial position
        TweenMax.set(target, { x: (i * this.state.separation), autoAlpha:0});

        // show cards
        TweenMax.to(target, 0.3, {autoAlpha:1});

        // animation
        TweenMax.to(target, 25, {
            ease: Linear.easeNone, x: "+="+this.state.distance, repeat: -1, rotation:0.1,
            modifiers: {
                x: (x)=>{
                    return x % this.state.distance; //force x value using modulus
                }
            }
        }); // Tweenmax

    }

    componentDidMount(){

        // set the card separation
        this.setCardSeparation();

        // check if the separation number is set
        const checker = setInterval(()=>{
            this.state.separation > 0 ?(()=>{
                this.props.cards.forEach(this.animateCards);
                clearInterval(checker);
            })() : null;
        }, 10);

    } // component did mount

    renderCard(e,i) {
        return(
            <div className="card" key={e} ref={e}>{e}</div>
    );
    }

    render(){
        return(
            <div className="container">
            <div className="row">
            <div className="col-sm-12 cards-wrap" ref="cardWrap">
            {this.props.cards.map(this.renderCard)}
            </div>
            </div>
            </div>
    );
    }

}

ReactDOM.render(
<App cards={cards} />, document.getElementById("app-wrap")
);