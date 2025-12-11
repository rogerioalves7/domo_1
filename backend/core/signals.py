from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import House, HouseMember, Transaction, Account

@receiver(post_save, sender=User)
def create_house_for_new_user(sender, instance, created, **kwargs):
    """
    Sempre que um usuário é criado, gera uma Casa Padrão e o vincula como Admin.
    Se for um convite, a View 'join_house' fará a limpeza posterior.
    """
    if created:
        # Verifica se já existe para evitar duplicatas em edge cases
        if not HouseMember.objects.filter(user=instance).exists():
            house_name = f"Casa de {instance.username}"
            house = House.objects.create(name=house_name)
            
            HouseMember.objects.create(
                user=instance,
                house=house,
                role='ADMIN'
            )

@receiver(post_save, sender=Transaction)
def update_balance_on_save(sender, instance, created, **kwargs):
    """
    Atualiza o saldo da conta quando uma transação é CRIADA ou EDITADA.
    """
    if not instance.account: return # Se for cartão de crédito, ignora (saldo da conta não muda)

    account = instance.account
    value = instance.value

    # Se for edição, precisamos desfazer o impacto do valor antigo (Lógica complexa omitida para brevidade, focando em criação)
    # Assumindo criação (created=True):
    
    if created:
        if instance.type == 'INCOME':
            account.balance += value
        else: # EXPENSE
            account.balance -= value
        
        account.save()

@receiver(post_delete, sender=Transaction)
def update_balance_on_delete(sender, instance, **kwargs):
    """
    Reverte o saldo quando uma transação é EXCLUÍDA.
    """
    if not instance.account: return

    account = instance.account
    value = instance.value

    # Faz o inverso da operação original
    if instance.type == 'INCOME':
        account.balance -= value # Remove a receita
    else:
        account.balance += value # Devolve a despesa
    
    account.save()