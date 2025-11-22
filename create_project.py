import os

structure = {
    "neurostack-copilot": {
        "backend": {
            "app": {
                "core": [
                    "config.py",
                    "auth.py",
                    "security.py"
                ],
                "models": [
                    "user.py"
                ],
                "rag": [
                    "embeddings.py",
                    "vectorstore.py",
                    "retriever_bm25.py",
                    "hybrid_retriever.py",
                    "validator.py",
                    "pipeline.py"
                ],
                "data": [
                    "faqs.json",
                    "index.faiss",    # these will just be empty files for now
                    "bm25.pkl"
                ],
                "routes": [
                    "auth_routes.py",
                    "rag_routes.py",
                    "feedback_routes.py"
                ],
                "utils": [
                    "hashing.py",
                    "schema.py"
                ],
                "main.py": None  # just create the file
            },
            "requirements.txt": None,
            "README.md": "# Backend\nTODO: write instructions",
            "run_local.bat": "uvicorn app.main:app --reload",
            "env.yml": None
        },
        "frontend": {
            "src": {
                "components": [
                    "ChatBox.jsx",
                    "RetrievedChunks.jsx",
                    "Login.jsx",
                    "Signup.jsx"
                ],
                "pages": [
                    "Chat.jsx",
                    "Auth.jsx"
                ],
                "api": [
                    "axiosClient.js"
                ],
                "App.jsx": None
            },
            "public": {},  # empty folder
            "package.json": None,
            "vite.config.js": None
        },
        "docs": [
            "architecture.png",   # you'll drop the actual images later
            "flow-diagram.png",
            "README_FULL.md"
        ],
        "README.md": "# Neurostack Copilot\n\nComing soon..."
    }
}

def create_structure(base_path, structure_dict):
    os.makedirs(base_path, exist_ok=True)
    
    for name, content in structure_dict.items():
        current_path = os.path.join(base_path, name)
        
        if isinstance(content, dict):
            # It's a folder
            os.makedirs(current_path, exist_ok=True)
            create_structure(current_path, content)
        
        elif isinstance(content, list):
            # Folder with list of files
            os.makedirs(current_path, exist_ok=True)
            for file in content:
                file_path = os.path.join(current_path, file)
                with open(file_path, 'a'):  # create empty file
                    pass
                if file.endswith(('.png', '.faiss', '.pkl')):
                    # Just touch binary files
                    open(file_path, 'wb').close()
        
        else:
            # Single file
            file_path = current_path
            if content is None:
                # Empty file
                with open(file_path, 'a'):
                    pass
            else:
                # File with some starter content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

# Run it from wherever you want the project to live
if __name__ == "__main__":
    project_root = os.path.join(os.getcwd(), "neurostack-copilot")
    create_structure(os.getcwd(), structure)
    print(f"Project structure created at:\n{project_root}")
    print("You're welcome 😎 Now go build something awesome!")