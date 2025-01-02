# Python Flask Server Example

from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/generate_chart_data', methods=['POST'])
def generate_chart_data():
    # Get the user message from the request
    user_message = request.json.get('user_message')

    # Process the user message to generate chart data
    # This can include analyzing keywords, fetching data, etc.
    chart_data = {
        "labels": ["Label1", "Label2", "Label3"],
        "values": [25, 45, 30]
    }

    # Return the generated chart data in JSON format
    return jsonify(chart_data)

if __name__ == '__main__':
    app.run(debug=True)
