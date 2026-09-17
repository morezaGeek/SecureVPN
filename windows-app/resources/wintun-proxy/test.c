#include <windows.h>

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    return TRUE;
}

__declspec(dllexport) int TestFunction(void) {
    return 42;
}
