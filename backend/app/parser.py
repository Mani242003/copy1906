import requests
import yaml

def parse_workflow_inputs(url):
    res = requests.get(url)

    if res.status_code != 200:
        return []

    data = yaml.safe_load(res.text)

    # ✅ FIX HERE
    on_section = data.get("on") or data.get(True)

    inputs = {}
    if on_section:
        inputs = on_section.get("workflow_dispatch", {}).get("inputs", {})

    fields = []

    for key, value in inputs.items():
        field_type = "text"
        options = []

        if value.get("type") == "choice":
            field_type = "select"
            options = value.get("options", [])

        fields.append({
            "key": key,
            "label": value.get("description", key),
            "type": field_type,
            "options": options
        })

    return fields