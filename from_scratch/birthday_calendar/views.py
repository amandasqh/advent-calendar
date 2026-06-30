from django.shortcuts import render


def home(request):
    return render(request, 'home.html')

def main_screen(request):
    return render(request, 'main_screen.html')

def letter(request):
    return render(request, 'letter.html')