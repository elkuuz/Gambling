import random as r
from flask import Blueprint, jsonify, request, session, Flask
from python_app.player_class import create_player_object

casino_blueprint = Blueprint('casino', __name__)


@casino_blueprint.route('/menu', methods=['GET'])
def casino_menu():
    create_player_object('test', 1000, 100, 0, 0, 'Helsinki-Vantaa', 'Finland', 'large_airport')
    from python_app.player_class import player

    try:
        if player.balance <= 0:
            return jsonify({
                "message": "You don't have any money. Please add funs to play",
                "balance": player.balance
            }), 400

        games = ["SNAKE EYES", "HILO", "BLACKJACK", "HORSE RACING"]
        return jsonify({
            "message": "Welcome to the casino! Choose a game to play",
            "games": games,
            "balance": player.balance
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casino_blueprint.route('/horse_race', methods=['POST'])
def horse_race():
    from python_app.player_class import player
    try:
        data = request.json

        # Validate the selected horse
        bet_horse = data.get("horse")
        if not bet_horse:
            return jsonify({"error": "Horse not specified"}), 400

        horses = ["Diddy", "Kolovastaava", "Sakke", "Rinne", "Uusitalo"]
        if bet_horse.capitalize() not in horses:
            return jsonify({"error": "Invalid horse. Please choose from the list."}), 400

        # Retrieve and validate the bet
        bet = data.get("bet", 0)
        error = player.validate_bet(bet)
        if error:
            return jsonify(error), 400

        # Generate odds and simulate the race
        odds = {horse: r.uniform(1.5, 5.0) for horse in horses}
        horse_speeds = {horse: r.randint(10, 20) for horse in horses}
        race_results = sorted(horse_speeds.items(), key=lambda x: x[1], reverse=True)

        winner = race_results[0][0]
        result_message = f"The winner is {winner}!"

        # Check if the player won
        if bet_horse.capitalize() == winner:
            winnings = bet * odds[bet_horse.capitalize()]
            result_message += f" Congratulations! You won {winnings:.0f} euros!"
            player.update_balance(winnings)
        else:
            result_message += f" You lost {bet} euros."
            player.update_balance(-bet)

        # Return the race results and player's updated balance
        return jsonify({
            "message": result_message,
            "player_balance": player.balance,
            "race_results": {horse: speed for horse, speed in race_results},
            "odds": {horse: round(odds[horse], 2) for horse in horses}
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Blackjack

def deal_card():
    cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    return r.choice(cards)


def calculate_hand(hand):
    card_values = {
        "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
        "J": 10, "Q": 10, "K": 10, "A": 11
    }
    value, ace_count = 0, 0
    for card in hand:
        value += card_values[card]
        if card == "A":
            ace_count += 1
    while value > 21 and ace_count:
        value -= 10
        ace_count -= 1
    return value


@casino_blueprint.route('/blackjack/start', methods=['POST'])
def start_blackjack():
    from python_app.player_class import player
    try:
        data = request.json
        bet = data.get("bet")

        if not isinstance(bet, (int, float)) or bet <= 0:
            return jsonify({"error": "Invalid bet amount"}), 400

        error = player.validate_bet(bet)
        if error:
            return jsonify({"error": error}), 400

        game_id = str(r.randint(1000, 9999))
        player_hand = [deal_card(), deal_card()]
        dealer_hand = [deal_card(), deal_card()]

        blackjack_games = session.get('blackjack_games', {})
        blackjack_games[game_id] = {
            "bet": bet,
            "player_hand": player_hand,
            "dealer_hand": dealer_hand,
            "player_value": calculate_hand(player_hand),
            "dealer_value": calculate_hand(dealer_hand),
            "finished": False
        }
        session['blackjack_games'] = blackjack_games

        return jsonify({
            "game_id": game_id,
            "player_hand": player_hand,
            "dealer_hand": [dealer_hand[0], "Hidden"],
            "message": "Game started! Your move: hit or stand."
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casino_blueprint.route('/blackjack/play', methods=['POST'])
def play_blackjack():
    from python_app.player_class import player
    try:
        data = request.json
        game_id = data.get("game_id")
        action = data.get("action")

        if not game_id or not action:
            return jsonify({"error": "Missing game_id or action in request"}), 400

        blackjack_games = session.get('blackjack_games', {})
        if game_id not in blackjack_games:
            return jsonify({"error": "Game not found"}), 400

        game = blackjack_games[game_id]
        if game["finished"]:
            return jsonify({"error": "Game already finished"}), 400

        if action == "hit":
            game["player_hand"].append(deal_card())
            game["player_value"] = calculate_hand(game["player_hand"])

            if game["player_value"] > 21:
                game["finished"] = True
                player.update_balance(-game["bet"])
                session['blackjack_games'] = blackjack_games
                return jsonify({
                    "result": "Busted! You lost.",
                    "player_hand": game["player_hand"],
                    "dealer_hand": game["dealer_hand"],
                    "balance": player.balance,
                    "finished": True
                }), 200

            session['blackjack_games'] = blackjack_games
            return jsonify({
                "player_hand": game["player_hand"],
                "player_value": game["player_value"],
                "dealer_hand": [game["dealer_hand"][0], "Hidden"],
                "message": "Your move: hit or stand.",
                "finished": False
            }), 200

        elif action == "stand":
            while game["dealer_value"] < 17:
                game["dealer_hand"].append(deal_card())
                game["dealer_value"] = calculate_hand(game["dealer_hand"])

            game["finished"] = True
            if game["dealer_value"] > 21 or game["player_value"] > game["dealer_value"]:
                result = "Player wins!"
                player.update_balance(game["bet"])
            elif game["dealer_value"] > game["player_value"]:
                result = "Dealer wins!"
                player.update_balance(-game["bet"])
            else:
                result = "It's a tie!"

            session['blackjack_games'] = blackjack_games
            return jsonify({
                "result": result,
                "player_hand": game["player_hand"],
                "dealer_hand": game["dealer_hand"],
                "player_value": game["player_value"],
                "dealer_value": game["dealer_value"],
                "balance": player.balance,
                "finished": True
            }), 200

        else:
            return jsonify({"error": "Invalid action"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casino_blueprint.route('/snake-eyes', methods=['POST'])
def snake_eyes():
    from python_app.player_class import player
    try:
        data = request.json
        bet = data.get("bet", 0)

        # Validate the bet
        if not isinstance(bet, (int, float)) or bet <= 0:
            return jsonify({"error": "Invalid bet amount"}), 400

        error = player.validate_bet(bet)
        if error:
            return jsonify({"error": error}), 400

        # Roll the dice
        dice_1, dice_2 = r.randint(1, 6), r.randint(1, 6)
        result_message = f"You rolled {dice_1} and {dice_2}."
        winnings = 0

        # Determine the outcome
        if dice_1 == dice_2 == 1:  # Snake Eyes
            winnings = bet * 10
            result_message += f" Snake Eyes! You won {winnings:.2f} euros."
        elif dice_1 == dice_2:  # Any other doubles
            winnings = bet
            result_message += f" Doubles! You won {winnings:.2f} euros."
        else:  # No win
            winnings = -bet
            result_message += f" No doubles. You lost {bet:.2f} euros."

        # Update the player's balance
        player.update_balance(winnings)

        # Return the result
        return jsonify({
            "message": result_message,
            "dice_rolls": [dice_1, dice_2],
            "winnings": winnings,
            "balance": player.balance
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casino_blueprint.route('/hilo/start', methods=['POST'])
def hilo_start():
    from python_app.player_class import player
    try:
        # Validate the bet amount
        data = request.json
        bet = data.get('bet', 0)

        if not isinstance(bet, (int, float)) or bet <= 0:
            return jsonify({"error": "Invalid or missing bet amount"}), 400

        error = player.validate_bet(bet)
        if error:
            return jsonify({"error": error}), 400

        # Generate the first card
        first_card = r.randint(1, 13)
        session['hilo_game'] = {"bet": bet, "first_card": first_card}

        return jsonify({
            "message": f"Your first card is {first_card}. Make your guess: Hi or Lo.",
            "first_card": first_card
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casino_blueprint.route('/hilo/guess', methods=['POST'])
def hilo_guess():
    from python_app.player_class import player
    try:
        # Retrieve the game data from the session
        game = session.get('hilo_game')
        if not game:
            return jsonify({"error": "No active Hi-Lo game. Start a new game first."}), 400

        # Retrieve and validate the guess
        data = request.json
        guess = data.get('guess', '').upper()
        if guess not in ["HI", "LO"]:
            return jsonify({"error": "Invalid guess. Please use 'HI' or 'LO'."}), 400

        # Generate the second card
        second_card = r.randint(1, 13)

        # Determine the outcome
        first_card = game['first_card']
        bet = game['bet']
        result_message = f"Your first card was {first_card}, and the second card is {second_card}."
        winnings = 0

        if (guess == "HI" and second_card > first_card) or (guess == "LO" and second_card < first_card):
            winnings = bet
            result_message += f" You guessed correctly! You won {winnings:.2f} euros."
        elif second_card == first_card:
            result_message += " It's a tie! No winnings or losses."
        else:
            winnings = -bet
            result_message += f" You guessed wrong. You lost {bet:.2f} euros."

        # Update the player's balance
        player.update_balance(winnings)

        # Clear the game session
        session.pop('hilo_game', None)
        print("Session after guessing debug", session)

        return jsonify({
            "message": result_message,
            "first_card": first_card,
            "second_card": second_card,
            "winnings": winnings,
            "balance": player.balance
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
